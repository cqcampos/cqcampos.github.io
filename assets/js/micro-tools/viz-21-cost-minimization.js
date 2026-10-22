/* Viz 21 — Cost Minimization: Iso-Cost Meets Isoquant
   (Producer-theory analog of Viz 13: Finding the Consumer's Optimum)
   Cobb-Douglas f(L,K) = L^0.5 * K^0.5.
   The firm chooses a target output Q (the constraint), then finds the
   input mix (L,K) that minimizes cost r_L*L + r_K*K subject to f(L,K)=Q.
   Student drags a point along the isoquant.
   At each point: MRTS vs input price ratio, bang-for-buck bars.
   At tangency: MRTS = r_L/r_K  ⟺  MPL/r_L = MPK/r_K.
   Q is chosen from discrete levels {6, 9, 12, 15} via buttons.
   All four isoquants are always visible; the active one is highlighted. */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var Qlevels = [9, 12, 15, 18];
    var a = 0.5, b = 0.5;

    var state = {
      Q: 9, rL: 10, rK: 20,
      dragL: 2   /* start left of optimum so MRTS > price ratio */
    };

    /* Q selector: discrete buttons */
    var qContainer = d3.select('#controls-21').append('div').attr('class', 'micro-slider-group');
    qContainer.append('div').attr('class', 'micro-slider-label')
      .append('span').text('Target output Q (the constraint)');
    var qBtnRow = qContainer.append('div').style('display', 'flex').style('gap', '0.4rem').style('margin-top', '0.2rem');

    function updateQButtons() {
      qBtnRow.selectAll('button').each(function () {
        var btn = d3.select(this);
        var val = +btn.attr('data-q');
        btn.classed('active', val === state.Q);
      });
    }

    Qlevels.forEach(function (q) {
      qBtnRow.append('button')
        .attr('class', 'micro-btn' + (q === state.Q ? ' active' : ''))
        .attr('data-q', q)
        .text('Q = ' + q)
        .on('click', function () {
          state.Q = q;
          /* Reset drag to left of new optimum */
          var opt = optimal();
          state.dragL = opt.L * 0.45;
          updateQButtons();
          render();
        });
    });

    var chart, xScale, yScale, dynamicG;

    /* Bar chart for bang-for-buck comparison */
    var barDiv = document.createElement('div');
    barDiv.id = 'chart-21-bars';
    barDiv.className = 'micro-chart';
    document.getElementById('chart-21').parentNode.appendChild(barDiv);

    var barChart;

    /* Production & isoquant helpers */
    function isoK(Q, L) {
      if (L <= 0) return Infinity;
      var base = Q / Math.pow(L, a);
      if (base <= 0) return 0;
      return Math.pow(base, 1 / b);
    }

    /* MRTS = MPL/MPK = (a/b)*(K/L) */
    function getMRTS(L, K) {
      if (L <= 0) return Infinity;
      return (a / b) * (K / L);
    }

    /* Optimal input bundle for a given Q */
    function optimalFor(Q) {
      var s = a + b;
      var Lstar = Math.pow(Q, 1 / s) * Math.pow((a * state.rK) / (b * state.rL), b / s);
      var Kstar = Math.pow(Q, 1 / s) * Math.pow((b * state.rL) / (a * state.rK), a / s);
      var Cstar = state.rL * Lstar + state.rK * Kstar;
      return { L: Lstar, K: Kstar, C: Cstar };
    }

    function optimal() { return optimalFor(state.Q); }

    /* Isoquant bounds (L range where K is within chart view) */
    function isoBounds(Q, Kmax) {
      var Lmin = 0.3;
      var Llow = Math.pow(Q / Math.pow(Kmax, b), 1 / a);
      if (Llow > Lmin) Lmin = Llow;
      return { Lmin: Lmin };
    }

    /* Fixed axis range based on the largest Q level */
    var maxQ = Qlevels[Qlevels.length - 1];

    function setup() {
      var optBig = optimalFor(maxQ);
      var Lmax = optBig.L * 3.5;
      var Kmax = optBig.K * 3.5;

      chart  = MT.createChart('chart-21', { height: 380 });
      xScale = d3.scaleLinear().domain([0, Lmax]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, Kmax]).range([chart.innerHeight, 0]);

      barChart = MT.createChart('chart-21-bars', {
        height: 120, margin: { top: 10, right: 40, bottom: 30, left: 65 }
      });
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Labor (L)', 'Capital (K)', { xTicks: 6, yTicks: 6 });
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function drawIsoquant(g, Q, color, sw, dashed) {
      var Kmax = yScale.domain()[1];
      var Lmax = xScale.domain()[1];
      var bounds = isoBounds(Q, Kmax);
      var Lmin = bounds.Lmin;
      if (Lmin < Lmax) {
        MT.drawCurve(g,
          function (L) { return isoK(Q, L); },
          [Lmin, Lmax], xScale, yScale,
          { color: color, strokeWidth: sw, dashed: dashed, nPoints: 300 });
      }
      return bounds;
    }

    function drawDynamic(colors) {
      var rL = state.rL, rK = state.rK, Q = state.Q;
      var priceRatio = rL / rK;
      var opt = optimal();
      var Kmax = yScale.domain()[1];
      var Lmax = xScale.domain()[1];

      /* Draw ALL isoquants — faded for non-active, bold for active */
      var activeBounds;
      Qlevels.forEach(function (q) {
        var isActive = (q === Q);
        var bounds = drawIsoquant(dynamicG, q,
          isActive ? colors.positive : colors.textLight,
          isActive ? 2.5 : 1.3,
          !isActive);
        if (isActive) activeBounds = bounds;

        /* Label each isoquant */
        var labelL = Lmax * 0.9;
        var labelK = isoK(q, labelL);
        if (labelK > 0.5 && labelK < Kmax * 0.95) {
          dynamicG.append('text')
            .attr('x', xScale(labelL)).attr('y', yScale(labelK) - 6)
            .style('fill', isActive ? colors.positive : colors.textLight)
            .style('font-size', isActive ? '10px' : '9px')
            .style('font-weight', isActive ? 'bold' : 'normal')
            .text('Q = ' + q);
        }
      });

      var isoBnds = activeBounds;

      /* Clamp drag point to the isoquant; snap to optimum when close */
      state.dragL = Math.max(isoBnds.Lmin + 0.3, Math.min(Lmax - 0.3, state.dragL));
      var atOptimum = Math.abs(state.dragL - opt.L) < (opt.L * 0.06);
      if (atOptimum) { state.dragL = opt.L; }
      var dragK = atOptimum ? opt.K : isoK(Q, state.dragL);
      var mrts = atOptimum ? priceRatio : getMRTS(state.dragL, dragK);

      /* Iso-cost line through the current drag point */
      var Cdrag = rL * state.dragL + rK * dragK;
      var KintDrag = Cdrag / rK;
      var LintDrag = Cdrag / rL;
      dynamicG.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(Math.min(KintDrag, Kmax)))
        .attr('x2', xScale(Math.min(LintDrag, Lmax))).attr('y2', yScale(0))
        .attr('stroke', colors.demand).attr('stroke-width', 2.5)
        .attr('opacity', atOptimum ? 1 : 0.7);

      /* Iso-cost line slope label */
      var slopeLabelL = Math.min(LintDrag * 0.45, Lmax * 0.5);
      var slopeLabelK = (Cdrag - rL * slopeLabelL) / rK;
      if (slopeLabelK > 0 && slopeLabelK < Kmax) {
        dynamicG.append('text')
          .attr('x', xScale(slopeLabelL) + 8).attr('y', yScale(slopeLabelK) - 8)
          .attr('text-anchor', 'start')
          .style('fill', colors.demand).style('font-size', '10px')
          .text('slope = r\u2097/r\u2096 = ' + MT.fmt(priceRatio, 2));
      }

      /* If not at optimum, also show the optimal (lower) iso-cost as dashed */
      if (!atOptimum) {
        var KintOpt = opt.C / rK;
        var LintOpt = opt.C / rL;
        dynamicG.append('line')
          .attr('x1', xScale(0)).attr('y1', yScale(Math.min(KintOpt, Kmax)))
          .attr('x2', xScale(Math.min(LintOpt, Lmax))).attr('y2', yScale(0))
          .attr('stroke', colors.demand).attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,4').attr('opacity', 0.5);
      }

      /* Tangent line at drag point (shows MRTS) */
      var tanLen = Math.min(3, opt.L * 0.6);
      var tL1 = state.dragL - tanLen;
      var tK1 = dragK + mrts * tanLen;
      var tL2 = state.dragL + tanLen;
      var tK2 = dragK - mrts * tanLen;
      if (tK1 > Kmax) {
        tK1 = Kmax;
        tL1 = state.dragL - (tK1 - dragK) / mrts;
      }
      if (tK2 < 0) {
        tK2 = 0;
        tL2 = state.dragL + dragK / mrts;
      }
      tL1 = Math.max(0, tL1);
      tL2 = Math.min(Lmax, tL2);

      dynamicG.append('line')
        .attr('x1', xScale(tL1)).attr('y1', yScale(tK1))
        .attr('x2', xScale(tL2)).attr('y2', yScale(tK2))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4');

      dynamicG.append('text')
        .attr('x', xScale(tL2) + 4).attr('y', yScale(tK2) - 4)
        .style('fill', colors.equilibrium).style('font-size', '10px').style('font-weight', 'bold')
        .text('MRTS = ' + MT.fmt(mrts, 2));

      /* Arrow showing direction to move along isoquant */
      if (!atOptimum) {
        var arrowId = 'arrowDir21';
        chart.defs.selectAll('#' + arrowId).remove();
        var shouldUseMoreL = mrts > priceRatio;
        var arrowColor = shouldUseMoreL ? colors.supply : colors.highlight;
        chart.defs.append('marker')
          .attr('id', arrowId).attr('markerWidth', 10).attr('markerHeight', 7)
          .attr('refX', 10).attr('refY', 3.5).attr('orient', 'auto')
          .append('path').attr('d', 'M0,0 L10,3.5 L0,7 Z').attr('fill', arrowColor);

        var dir = opt.L > state.dragL ? 1 : -1;
        var stepL = dir * Math.min(1.5, Math.abs(opt.L - state.dragL) * 0.5);
        var aL2 = state.dragL + stepL;
        var aK2 = isoK(Q, aL2);
        dynamicG.append('line')
          .attr('x1', xScale(state.dragL)).attr('y1', yScale(dragK))
          .attr('x2', xScale(aL2)).attr('y2', yScale(aK2))
          .attr('stroke', arrowColor).attr('stroke-width', 3)
          .attr('marker-end', 'url(#' + arrowId + ')');

        var labelText, labelAnchor, labelOffX;
        if (shouldUseMoreL) {
          labelText = 'Use more L \u2192';
          labelAnchor = 'start';
          labelOffX = 14;
        } else {
          labelText = '\u2190 Use more K';
          labelAnchor = 'end';
          labelOffX = -14;
        }
        dynamicG.append('text')
          .attr('x', xScale(state.dragL) + labelOffX).attr('y', yScale(dragK) - 16)
          .attr('text-anchor', labelAnchor)
          .style('fill', arrowColor).style('font-size', '11px').style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(labelText);
      }

      /* Optimal tangency point */
      dynamicG.append('circle')
        .attr('cx', xScale(opt.L)).attr('cy', yScale(opt.K))
        .attr('r', 7).attr('fill', colors.positive)
        .attr('stroke', '#fff').attr('stroke-width', 2);
      dynamicG.append('text')
        .attr('x', xScale(opt.L) + 12).attr('y', yScale(opt.K) + 18)
        .style('fill', colors.positive).style('font-size', '11px').style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text('Tangency (' + MT.fmt(opt.L, 1) + ', ' + MT.fmt(opt.K, 1) + ')');

      /* Draggable point on the isoquant */
      var dragPt = dynamicG.append('circle')
        .attr('cx', xScale(state.dragL)).attr('cy', yScale(dragK))
        .attr('r', 8).attr('fill', atOptimum ? colors.positive : colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2)
        .attr('cursor', 'grab').attr('class', 'drag-point');

      dragPt.call(d3.drag().on('drag', function (event) {
        var L = xScale.invert(event.x);
        L = Math.max(isoBnds.Lmin + 0.3, Math.min(Lmax - 0.3, L));
        state.dragL = L;
        dynamicG.selectAll('*').remove();
        drawDynamic(colors);
      }));

      /* === Bang-for-Buck bar chart === */
      var MPL = a * Math.pow(state.dragL, a - 1) * Math.pow(dragK, b);
      var MPK = b * Math.pow(state.dragL, a) * Math.pow(dragK, b - 1);
      var bfbL, bfbK;
      if (atOptimum) {
        bfbL = MPL / rL;
        bfbK = bfbL;
      } else {
        bfbL = MPL / rL;
        bfbK = MPK / rK;
      }
      drawBars(colors, bfbL, bfbK, atOptimum);

      /* Info panel */
      if (atOptimum) {
        d3.select('#info-21').html(
          '<strong style="color:' + colors.positive + '">At the tangency \u2014 cost is minimized!</strong>' +
          '<br><strong>MRTS = r\u2097/r\u2096 = ' + MT.fmt(priceRatio, 2) + '</strong>' +
          '<br>The \u201cbang for the buck\u201d condition holds: MPL/r\u2097 = MPK/r\u2096 = ' + MT.fmt(bfbL, 4) +
          '<br><strong>L* = ' + MT.fmt(opt.L, 2) + ', K* = ' + MT.fmt(opt.K, 2) +
          ', C* = $' + MT.fmt(opt.C, 2) + '</strong>' +
          '<br><em>The extra output per dollar spent on labor equals the extra output per dollar spent on capital. No reallocation can produce Q = ' + Q + ' at lower cost.</em>'
        );
      } else {
        var whichInput = mrts > priceRatio ? 'labor' : 'capital';
        var mrtsVsPr = mrts > priceRatio ? '>' : '<';
        d3.select('#info-21').html(
          '<strong>Constraint:</strong> produce Q = ' + Q + ' units' +
          '<br><strong>MRTS = ' + MT.fmt(mrts, 2) + '</strong> vs <strong>r\u2097/r\u2096 = ' + MT.fmt(priceRatio, 2) + '</strong>' +
          '<br><span style="color:' + (mrts > priceRatio ? colors.supply : colors.highlight) + '"><strong>' +
          'The output-per-dollar from ' + whichInput + ' is higher \u2192 use more ' + whichInput + '.</strong></span>' +
          '<br>MPL/r\u2097 = ' + MT.fmt(bfbL, 4) +
          ' ' + mrtsVsPr + ' MPK/r\u2096 = ' + MT.fmt(bfbK, 4) +
          '<br>Cost at this mix: $' + MT.fmt(Cdrag, 2) +
          ' vs minimum: $' + MT.fmt(opt.C, 2) +
          ' (+$' + MT.fmt(Cdrag - opt.C, 2) + ')' +
          '<br><em>Drag to the tangency to see the \u201cbang for the buck\u201d equalize.</em>'
        );
      }

      /* Math panel */
      MT.updateMath('math-21',
        '\\text{MRTS} = ' + MT.fmt(mrts, 2) +
        '\\quad' + (atOptimum ? '=' : (mrts > priceRatio ? '>' : '<')) + '\\quad' +
        '\\frac{r_L}{r_K} = ' + MT.fmt(priceRatio, 2) +
        '\\qquad \\frac{MPL}{r_L} = ' + MT.fmt(bfbL, 4) +
        '\\;' + (atOptimum ? '=' : (bfbL > bfbK ? '>' : '<')) + '\\;' +
        '\\frac{MPK}{r_K} = ' + MT.fmt(bfbK, 4) +
        (atOptimum ? '\\quad\\checkmark' : ''));
    }

    function drawBars(colors, bfbL, bfbK, atOptimum) {
      d3.select('#chart-21-bars').selectAll('*').remove();
      barChart = MT.createChart('chart-21-bars', {
        height: 120, margin: { top: 10, right: 40, bottom: 30, left: 65 }
      });

      var maxBfb = Math.max(bfbL, bfbK) * 1.3;
      if (maxBfb <= 0) return;
      var bX = d3.scaleLinear().domain([0, maxBfb]).range([0, barChart.innerWidth]);
      var bY = d3.scaleBand().domain(['MPL/r\u2097', 'MPK/r\u2096']).range([0, barChart.innerHeight]).padding(0.35);

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
        .text('Output per Dollar (\u201cBang for the Buck\u201d)');

      var barColorL = atOptimum ? colors.positive : (bfbL > bfbK ? colors.supply : colors.textLight);
      var barColorK = atOptimum ? colors.positive : (bfbK > bfbL ? colors.highlight : colors.textLight);

      barChart.plotArea.append('rect')
        .attr('x', 0).attr('y', bY('MPL/r\u2097'))
        .attr('width', bX(bfbL)).attr('height', bY.bandwidth())
        .attr('fill', barColorL).attr('opacity', 0.8).attr('rx', 3);

      barChart.plotArea.append('rect')
        .attr('x', 0).attr('y', bY('MPK/r\u2096'))
        .attr('width', bX(bfbK)).attr('height', bY.bandwidth())
        .attr('fill', barColorK).attr('opacity', 0.8).attr('rx', 3);

      barChart.plotArea.append('text')
        .attr('x', bX(bfbL) + 5).attr('y', bY('MPL/r\u2097') + bY.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('fill', barColorL).style('font-size', '11px').style('font-weight', 'bold')
        .text(MT.fmt(bfbL, 4));

      barChart.plotArea.append('text')
        .attr('x', bX(bfbK) + 5).attr('y', bY('MPK/r\u2096') + bY.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('fill', barColorK).style('font-size', '11px').style('font-weight', 'bold')
        .text(MT.fmt(bfbK, 4));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
