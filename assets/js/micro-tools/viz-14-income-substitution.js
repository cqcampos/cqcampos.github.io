/* Viz 14 — Income & Substitution Effects (Hicksian Decomposition)
   U = x^0.5 y^0.5.  Price of X changes.
   Points: A (initial), B (compensated/Hicksian), C (final).
   Arrows show substitution, income, and total effects.               */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { pX0: 10, pY: 5, M: 200, pX1: 5, showDecomp: true };

    MT.addSlider('controls-14', {
      label: 'New price of X (p\u2093\u2032)', min: 1, max: 20, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.pX1 = v; update(); }
    });

    MT.addToggle('controls-14', {
      label: 'Show Hicksian decomposition',
      checked: true,
      onChange: function (v) { state.showDecomp = v; update(); }
    });

    var chart, xScale, yScale, dynamicG;

    function getU(x, y) { return Math.sqrt(x * y); }

    function optBundle(px, py, m) {
      return { x: 0.5 * m / px, y: 0.5 * m / py };
    }

    function setup() {
      chart = MT.createChart('chart-14', { height: 420 });
      var maxVal = Math.max(state.M / state.pY, state.M / Math.min(state.pX0, state.pX1)) * 1.15;
      maxVal = Math.max(maxVal, 50);
      xScale = d3.scaleLinear().domain([0, maxVal]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, maxVal]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Good X', 'Good Y');
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() { render(); }

    function drawIC(g, uTarget, color, sw, dashed) {
      var uSq = uTarget * uTarget;
      var xDom = xScale.domain(), yDom = yScale.domain();
      var xLo = Math.max(0.3, uSq / yDom[1]);
      var xHi = Math.min(xDom[1], uSq / 0.3);
      if (xLo < xHi) {
        MT.drawCurve(g,
          function (x) { return uSq / x; },
          [xLo, xHi], xScale, yScale,
          { color: color, strokeWidth: sw, dashed: dashed, nPoints: 200 });
      }
    }

    function drawDynamic(colors) {
      var pX0 = state.pX0, pY = state.pY, M = state.M, pX1 = state.pX1;

      /* A: initial optimum */
      var A = optBundle(pX0, pY, M);
      var uA = getU(A.x, A.y);

      /* C: final optimum */
      var C = optBundle(pX1, pY, M);
      var uC = getU(C.x, C.y);

      /* B: Hicksian (compensated) bundle — keep uA, face new prices */
      var Mprime = 2 * uA * Math.sqrt(pX1 * pY);
      var B = optBundle(pX1, pY, Mprime);

      /* Arrow markers */
      chart.defs.selectAll('#arrowSub14, #arrowInc14').remove();
      chart.defs.append('marker')
        .attr('id', 'arrowSub14').attr('markerWidth', 8).attr('markerHeight', 6)
        .attr('refX', 8).attr('refY', 3).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0 L8,3 L0,6 Z').attr('fill', colors.highlight);
      chart.defs.append('marker')
        .attr('id', 'arrowInc14').attr('markerWidth', 8).attr('markerHeight', 6)
        .attr('refX', 8).attr('refY', 3).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0 L8,3 L0,6 Z').attr('fill', colors.revenue);

      /* Original budget line */
      var intX0 = M / pX0, intY0 = M / pY;
      var origDashed = Math.abs(pX1 - pX0) > 0.01;
      MT.drawCurve(dynamicG,
        function (x) { return intY0 - (pX0 / pY) * x; },
        [0, Math.min(intX0, xScale.domain()[1])], xScale, yScale,
        { color: colors.demand, strokeWidth: origDashed ? 2 : 2.5, dashed: origDashed });

      /* New budget line (only draw separately if price changed) */
      var intX1 = M / pX1;
      if (Math.abs(pX1 - pX0) > 0.01) {
        MT.drawCurve(dynamicG,
          function (x) { return intY0 - (pX1 / pY) * x; },
          [0, Math.min(intX1, xScale.domain()[1])], xScale, yScale,
          { color: colors.demand, strokeWidth: 2.5 });
      }

      /* IC through A */
      drawIC(dynamicG, uA, colors.supply, 2, false);

      /* IC through C (only if different from A) */
      if (Math.abs(pX1 - pX0) > 0.01) {
        drawIC(dynamicG, uC, colors.positive, 2, false);
      }

      /* Compensated budget line and B — hide when no price change */
      var priceChanged = Math.abs(pX1 - pX0) > 0.01;
      if (state.showDecomp && priceChanged) {
        var intXp = Mprime / pX1, intYp = Mprime / pY;
        MT.drawCurve(dynamicG,
          function (x) { return intYp - (pX1 / pY) * x; },
          [0, Math.min(intXp, xScale.domain()[1])], xScale, yScale,
          { color: colors.highlight, strokeWidth: 1.5, dashed: true });

        /* Point B */
        dynamicG.append('circle')
          .attr('cx', xScale(B.x)).attr('cy', yScale(B.y))
          .attr('r', 7).attr('fill', colors.highlight)
          .attr('stroke', '#fff').attr('stroke-width', 2);
        dynamicG.append('text')
          .attr('x', xScale(B.x) + 10).attr('y', yScale(B.y) - 10)
          .style('fill', colors.highlight).style('font-size', '11px').style('font-weight', 'bold')
          .text('B (' + MT.fmt(B.x, 1) + ', ' + MT.fmt(B.y, 1) + ')');

        /* Substitution effect arrow (A → B) */
        dynamicG.append('line')
          .attr('x1', xScale(A.x)).attr('y1', yScale(0) + 22)
          .attr('x2', xScale(B.x)).attr('y2', yScale(0) + 22)
          .attr('stroke', colors.highlight).attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowSub14)');
        dynamicG.append('text')
          .attr('x', xScale((A.x + B.x) / 2)).attr('y', yScale(0) + 18)
          .attr('text-anchor', 'middle')
          .style('fill', colors.highlight).style('font-size', '9px').style('font-weight', 'bold')
          .text('Substitution');

        /* Income effect arrow (B → C) */
        dynamicG.append('line')
          .attr('x1', xScale(B.x)).attr('y1', yScale(0) + 34)
          .attr('x2', xScale(C.x)).attr('y2', yScale(0) + 34)
          .attr('stroke', colors.revenue).attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowInc14)');
        dynamicG.append('text')
          .attr('x', xScale((B.x + C.x) / 2)).attr('y', yScale(0) + 30)
          .attr('text-anchor', 'middle')
          .style('fill', colors.revenue).style('font-size', '9px').style('font-weight', 'bold')
          .text('Income');
      }

      /* Point A */
      dynamicG.append('circle')
        .attr('cx', xScale(A.x)).attr('cy', yScale(A.y))
        .attr('r', 7).attr('fill', colors.supply)
        .attr('stroke', '#fff').attr('stroke-width', 2);
      dynamicG.append('text')
        .attr('x', xScale(A.x) - 10).attr('y', yScale(A.y) - 10)
        .attr('text-anchor', 'end')
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold')
        .text('A (' + MT.fmt(A.x, 1) + ', ' + MT.fmt(A.y, 1) + ')');

      /* Point C (only if price changed) */
      if (priceChanged) {
        dynamicG.append('circle')
          .attr('cx', xScale(C.x)).attr('cy', yScale(C.y))
          .attr('r', 7).attr('fill', colors.positive)
          .attr('stroke', '#fff').attr('stroke-width', 2);
        dynamicG.append('text')
          .attr('x', xScale(C.x) + 10).attr('y', yScale(C.y) + 15)
          .style('fill', colors.positive).style('font-size', '11px').style('font-weight', 'bold')
          .text('C (' + MT.fmt(C.x, 1) + ', ' + MT.fmt(C.y, 1) + ')');
      }

      /* Info */
      var subEffect = B.x - A.x;
      var incEffect = C.x - B.x;
      var totalEffect = C.x - A.x;

      if (priceChanged) {
        d3.select('#info-14').html(
          '<strong>Initial price:</strong> p\u2093 = $' + MT.fmt(pX0, 1) +
          '&ensp;\u2192&ensp;<strong>New price:</strong> p\u2093\u2032 = $' + MT.fmt(pX1, 1) +
          '<br><strong>A (initial):</strong> (' + MT.fmt(A.x, 1) + ', ' + MT.fmt(A.y, 1) + '), U=' + MT.fmt(uA, 1) +
          '<br><strong>B (compensated):</strong> (' + MT.fmt(B.x, 1) + ', ' + MT.fmt(B.y, 1) + ') \u2014 same IC as A (utility held constant)' +
          '<br><strong>C (final):</strong> (' + MT.fmt(C.x, 1) + ', ' + MT.fmt(C.y, 1) + '), U=' + MT.fmt(uC, 1) +
          '<br><strong>Substitution (A\u2192B):</strong> \u0394x=' + MT.fmt(subEffect, 1) + ' (utility constant, prices change)' +
          '<br><strong>Income (B\u2192C):</strong> \u0394x=' + MT.fmt(incEffect, 1) + ' (purchasing power change)' +
          '&ensp;<strong>Total:</strong> \u0394x=' + MT.fmt(totalEffect, 1) +
          '<br><em>Normal good: both effects reinforce each other.</em>'
        );
        MT.updateMath('math-14',
          '\\underbrace{' + MT.fmt(totalEffect, 1) + '}_{\\text{Total}} = ' +
          '\\underbrace{' + MT.fmt(subEffect, 1) + '}_{\\text{Substitution}} + ' +
          '\\underbrace{' + MT.fmt(incEffect, 1) + '}_{\\text{Income}}');
      } else {
        d3.select('#info-14').html(
          '<strong>Initial price:</strong> p\u2093 = $' + MT.fmt(pX0, 1) +
          '<br><strong>A (initial):</strong> (' + MT.fmt(A.x, 1) + ', ' + MT.fmt(A.y, 1) + '), U=' + MT.fmt(uA, 1) +
          '<br><em>Move the price slider to see how the consumer adjusts.</em>'
        );
        MT.updateMath('math-14',
          'p_x = ' + MT.fmt(pX0, 1) + ',\\quad x^* = \\frac{M}{2p_x} = ' + MT.fmt(A.x, 1) +
          ',\\quad y^* = \\frac{M}{2p_y} = ' + MT.fmt(A.y, 1));
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
