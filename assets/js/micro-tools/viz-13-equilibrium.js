/* Viz 13 — Finding the Consumer's Optimum (Bang for the Buck)
   Cobb-Douglas utility U = x^α y^(1-α).
   Student drags a point along the OPTIMAL indifference curve.
   At each point: MRS vs price ratio, bang-for-buck bars, direction arrow.
   At tangency: MRS = px/py ⟺ MUx/px = MUy/py.                          */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = {
      pX: 5, pY: 5, M: 100, alpha: 0.5,
      dragX: 6   /* start left of optimum so MRS > price ratio */
    };

    var sliders = {};
    sliders.pX = MT.addSlider('controls-13', {
      label: 'Price of X (p\u2093)', min: 1, max: 15, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.pX = v; update(); }
    });
    sliders.pY = MT.addSlider('controls-13', {
      label: 'Price of Y (p\u2094)', min: 1, max: 15, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.pY = v; update(); }
    });
    sliders.M = MT.addSlider('controls-13', {
      label: 'Income (M)', min: 20, max: 200, value: 100, step: 5,
      format: function (v) { return '$' + v.toFixed(0); },
      onChange: function (v) { state.M = v; update(); }
    });
    sliders.alpha = MT.addSlider('controls-13', {
      label: 'How much you value X vs Y (\u03B1)', min: 0.1, max: 0.9, value: 0.5, step: 0.05,
      format: function (v) {
        if (v < 0.4) return v.toFixed(2) + ' (value Y more)';
        if (v > 0.6) return v.toFixed(2) + ' (value X more)';
        return v.toFixed(2) + ' (balanced)';
      },
      onChange: function (v) { state.alpha = v; update(); }
    });

    var chart, xScale, yScale, dynamicG;

    /* Bar chart for bang-for-buck comparison */
    var barDiv = document.createElement('div');
    barDiv.id = 'chart-13-bars';
    barDiv.className = 'micro-chart';
    document.getElementById('chart-13').parentNode.appendChild(barDiv);

    var barChart;

    function getU(x, y) {
      if (x <= 0 || y <= 0) return 0;
      return Math.pow(x, state.alpha) * Math.pow(y, 1 - state.alpha);
    }

    function getMRS(x, y) {
      if (x <= 0) return Infinity;
      return (state.alpha / (1 - state.alpha)) * (y / x);
    }

    function optBundle() {
      return {
        x: state.alpha * state.M / state.pX,
        y: (1 - state.alpha) * state.M / state.pY
      };
    }

    /* Given x on the optimal IC, find y */
    function icY(x, uStar, a) {
      if (x <= 0) return Infinity;
      return Math.pow(uStar / Math.pow(x, a), 1 / (1 - a));
    }

    function setup() {
      chart = MT.createChart('chart-13', { height: 380 });
      var xMax = Math.max(25, state.M / state.pX * 1.3);
      var yMax = Math.max(25, state.M / state.pY * 1.3);
      xScale = d3.scaleLinear().domain([0, xMax]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, yMax]).range([chart.innerHeight, 0]);

      barChart = MT.createChart('chart-13-bars', {
        height: 120, margin: { top: 10, right: 40, bottom: 30, left: 65 }
      });
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Good X', 'Good Y');
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      render();
    }

    function drawIC(g, uTarget, a, color, sw, dashed) {
      var xDom = xScale.domain(), yDom = yScale.domain();
      var xLo = Math.pow(uTarget / Math.pow(yDom[1], 1 - a), 1 / a);
      var xHi = Math.pow(uTarget / Math.pow(0.3, 1 - a), 1 / a);
      xLo = Math.max(0.3, xLo);
      xHi = Math.min(xDom[1], xHi);
      if (xLo < xHi) {
        MT.drawCurve(g,
          function (x) { return Math.pow(uTarget / Math.pow(x, a), 1 / (1 - a)); },
          [xLo, xHi], xScale, yScale,
          { color: color, strokeWidth: sw, dashed: dashed, nPoints: 200 });
      }
      return { xLo: xLo, xHi: xHi };
    }

    function drawDynamic(colors) {
      var a = state.alpha;
      var intX = state.M / state.pX;
      var intY = state.M / state.pY;
      var priceRatio = state.pX / state.pY;
      var opt = optBundle();
      var uStar = getU(opt.x, opt.y);

      /* Budget line */
      MT.drawCurve(dynamicG,
        function (x) { return intY - priceRatio * x; },
        [0, intX], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      /* Optimal IC */
      var icBounds = drawIC(dynamicG, uStar, a, colors.positive, 2.5, false);

      /* Clamp drag point to the IC; snap to optimum when close */
      state.dragX = Math.max(icBounds.xLo + 0.3, Math.min(icBounds.xHi - 0.3, state.dragX));
      var atOptimum = Math.abs(state.dragX - opt.x) < 0.5;
      if (atOptimum) { state.dragX = opt.x; }
      var dragY = atOptimum ? opt.y : icY(state.dragX, uStar, a);
      var mrs = atOptimum ? priceRatio : getMRS(state.dragX, dragY);

      /* Tangent line at drag point (shows MRS) */
      var tanLen = 4;
      var tx1 = state.dragX - tanLen;
      var ty1 = dragY + mrs * tanLen;
      var tx2 = state.dragX + tanLen;
      var ty2 = dragY - mrs * tanLen;
      /* Clip to chart bounds */
      if (ty1 > yScale.domain()[1]) {
        var excess = ty1 - yScale.domain()[1];
        ty1 = yScale.domain()[1];
        tx1 = state.dragX - (dragY - ty1) / mrs;
      }
      if (ty2 < 0) {
        ty2 = 0;
        tx2 = state.dragX + dragY / mrs;
      }
      tx1 = Math.max(0, tx1);
      tx2 = Math.min(xScale.domain()[1], tx2);

      dynamicG.append('line')
        .attr('x1', xScale(tx1)).attr('y1', yScale(ty1))
        .attr('x2', xScale(tx2)).attr('y2', yScale(ty2))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4');

      /* Label the tangent */
      dynamicG.append('text')
        .attr('x', xScale(tx2) + 4).attr('y', yScale(ty2) - 4)
        .style('fill', colors.equilibrium).style('font-size', '10px').style('font-weight', 'bold')
        .text('MRS = ' + MT.fmt(mrs, 2));

      /* Budget line slope label */
      dynamicG.append('text')
        .attr('x', xScale(intX / 2) + 10).attr('y', yScale(intY / 2) - 10)
        .attr('text-anchor', 'start')
        .style('fill', colors.demand).style('font-size', '10px')
        .text('slope = p\u2093/p\u2094 = ' + MT.fmt(priceRatio, 2));

      /* Arrow showing direction to move along IC */
      if (!atOptimum) {
        var arrowId = 'arrowDir13';
        chart.defs.selectAll('#' + arrowId).remove();
        var shouldBuyMoreX = mrs > priceRatio;
        var arrowColor = shouldBuyMoreX ? colors.supply : colors.highlight;
        chart.defs.append('marker')
          .attr('id', arrowId).attr('markerWidth', 10).attr('markerHeight', 7)
          .attr('refX', 10).attr('refY', 3.5).attr('orient', 'auto')
          .append('path').attr('d', 'M0,0 L10,3.5 L0,7 Z').attr('fill', arrowColor);

        /* Arrow from drag point toward optimum along the IC */
        var dir = opt.x > state.dragX ? 1 : -1;
        var stepX = dir * Math.min(2, Math.abs(opt.x - state.dragX) * 0.5);
        var ax2 = state.dragX + stepX;
        var ay2 = icY(ax2, uStar, a);
        dynamicG.append('line')
          .attr('x1', xScale(state.dragX)).attr('y1', yScale(dragY))
          .attr('x2', xScale(ax2)).attr('y2', yScale(ay2))
          .attr('stroke', arrowColor).attr('stroke-width', 3)
          .attr('marker-end', 'url(#' + arrowId + ')');

        /* Direction label */
        var labelText, labelAnchor, labelOffX;
        if (shouldBuyMoreX) {
          labelText = 'Buy more X \u2192';
          labelAnchor = 'start';
          labelOffX = 14;
        } else {
          labelText = '\u2190 Buy more Y';
          labelAnchor = 'end';
          labelOffX = -14;
        }
        dynamicG.append('text')
          .attr('x', xScale(state.dragX) + labelOffX).attr('y', yScale(dragY) - 16)
          .attr('text-anchor', labelAnchor)
          .style('fill', arrowColor).style('font-size', '11px').style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(labelText);
      }

      /* Optimal tangency point */
      dynamicG.append('circle')
        .attr('cx', xScale(opt.x)).attr('cy', yScale(opt.y))
        .attr('r', 7).attr('fill', colors.positive)
        .attr('stroke', '#fff').attr('stroke-width', 2);
      dynamicG.append('text')
        .attr('x', xScale(opt.x) + 12).attr('y', yScale(opt.y) + 18)
        .style('fill', colors.positive).style('font-size', '11px').style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text('Tangency (' + MT.fmt(opt.x, 1) + ', ' + MT.fmt(opt.y, 1) + ')');

      /* Draggable point on the IC */
      var dragPt = dynamicG.append('circle')
        .attr('cx', xScale(state.dragX)).attr('cy', yScale(dragY))
        .attr('r', 8).attr('fill', atOptimum ? colors.positive : colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2)
        .attr('cursor', 'grab').attr('class', 'drag-point');

      dragPt.call(d3.drag().on('drag', function (event) {
        var x = xScale.invert(event.x);
        x = Math.max(icBounds.xLo + 0.3, Math.min(icBounds.xHi - 0.3, x));
        state.dragX = x;
        dynamicG.selectAll('*').remove();
        drawDynamic(colors);
      }));

      /* === Bang-for-Buck bar chart === */
      var bfbX, bfbY;
      if (atOptimum) {
        /* Use exact value so both sides are identical */
        bfbX = uStar / state.M;
        bfbY = uStar / state.M;
      } else {
        bfbX = (a * uStar / state.dragX) / state.pX;
        bfbY = ((1 - a) * uStar / dragY) / state.pY;
      }
      drawBars(colors, bfbX, bfbY, atOptimum);

      /* Info */
      if (atOptimum) {
        d3.select('#info-13').html(
          '<strong style="color:' + colors.positive + '">At the tangency \u2014 the optimum!</strong>' +
          '<br><strong>MRS = p\u2093/p\u2094 = ' + MT.fmt(priceRatio, 2) + '</strong>' +
          '<br>The \u201cbang for the buck\u201d condition holds: MU\u2093/p\u2093 = MU\u2094/p\u2094 = ' + MT.fmt(bfbX, 3) +
          '<br><strong>U* = </strong>' + MT.fmt(uStar, 2) +
          '<br><em>The dollar value you get from X equals the dollar value you get from Y. No reallocation can do better.</em>'
        );
      } else {
        var whichBuy = mrs > priceRatio ? 'X' : 'Y';
        var mrsVsPr = mrs > priceRatio ? '>' : '<';
        d3.select('#info-13').html(
          '<strong>MRS = ' + MT.fmt(mrs, 2) + '</strong> vs <strong>p\u2093/p\u2094 = ' + MT.fmt(priceRatio, 2) + '</strong>' +
          '<br><span style="color:' + (mrs > priceRatio ? colors.supply : colors.highlight) + '"><strong>' +
          'Your relative value of ' + whichBuy + ' is higher than the relative market value \u2192 buy more ' + whichBuy + '.</strong></span>' +
          '<br>MU\u2093/p\u2093 = ' + MT.fmt(bfbX, 3) +
          ' ' + mrsVsPr + ' MU\u2094/p\u2094 = ' + MT.fmt(bfbY, 3) +
          '<br><em>Drag to the tangency to see the \u201cbang for the buck\u201d equalize.</em>'
        );
      }

      MT.updateMath('math-13',
        'MRS = ' + MT.fmt(mrs, 2) +
        '\\quad' + (atOptimum ? '=' : (mrs > priceRatio ? '>' : '<')) + '\\quad' +
        '\\frac{p_x}{p_y} = ' + MT.fmt(priceRatio, 2) +
        '\\qquad \\frac{MU_x}{p_x} = ' + MT.fmt(bfbX, 3) +
        '\\;' + (atOptimum ? '=' : (bfbX > bfbY ? '>' : '<')) + '\\;' +
        '\\frac{MU_y}{p_y} = ' + MT.fmt(bfbY, 3) +
        (atOptimum ? '\\quad\\checkmark' : ''));
    }

    function drawBars(colors, bfbX, bfbY, atOptimum) {
      d3.select('#chart-13-bars').selectAll('*').remove();
      barChart = MT.createChart('chart-13-bars', {
        height: 120, margin: { top: 10, right: 40, bottom: 30, left: 65 }
      });

      var maxBfb = Math.max(bfbX, bfbY) * 1.3;
      if (maxBfb <= 0) return;
      var bX = d3.scaleLinear().domain([0, maxBfb]).range([0, barChart.innerWidth]);
      var bY = d3.scaleBand().domain(['MU\u2093/p\u2093', 'MU\u2094/p\u2094']).range([0, barChart.innerHeight]).padding(0.35);

      barChart.plotArea.append('g')
        .attr('transform', 'translate(0,' + barChart.innerHeight + ')')
        .call(d3.axisBottom(bX).ticks(5))
        .selectAll('text').style('fill', colors.text);
      barChart.plotArea.selectAll('.domain, .tick line').attr('stroke', colors.gridLines);

      barChart.plotArea.append('g')
        .call(d3.axisLeft(bY))
        .selectAll('text').style('fill', colors.text).style('font-size', '11px');
      barChart.plotArea.selectAll('.domain').attr('stroke', colors.gridLines);
      barChart.plotArea.selectAll('.tick line').attr('stroke', 'none');

      barChart.plotArea.append('text')
        .attr('x', barChart.innerWidth / 2).attr('y', -2)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '11px').style('font-weight', 'bold')
        .text('Utility per Dollar (\u201cBang for the Buck\u201d)');

      var barColorX = atOptimum ? colors.positive : (bfbX > bfbY ? colors.supply : colors.textLight);
      var barColorY = atOptimum ? colors.positive : (bfbY > bfbX ? colors.highlight : colors.textLight);

      barChart.plotArea.append('rect')
        .attr('x', 0).attr('y', bY('MU\u2093/p\u2093'))
        .attr('width', bX(bfbX)).attr('height', bY.bandwidth())
        .attr('fill', barColorX).attr('opacity', 0.8).attr('rx', 3);

      barChart.plotArea.append('rect')
        .attr('x', 0).attr('y', bY('MU\u2094/p\u2094'))
        .attr('width', bX(bfbY)).attr('height', bY.bandwidth())
        .attr('fill', barColorY).attr('opacity', 0.8).attr('rx', 3);

      barChart.plotArea.append('text')
        .attr('x', bX(bfbX) + 5).attr('y', bY('MU\u2093/p\u2093') + bY.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('fill', barColorX).style('font-size', '11px').style('font-weight', 'bold')
        .text(MT.fmt(bfbX, 3));

      barChart.plotArea.append('text')
        .attr('x', bX(bfbY) + 5).attr('y', bY('MU\u2094/p\u2094') + bY.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('fill', barColorY).style('font-size', '11px').style('font-weight', 'bold')
        .text(MT.fmt(bfbY, 3));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
