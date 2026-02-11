/* Viz 15 — Revenue Decomposition & Marginal Revenue
   Inverse demand: P(Q) = A − BQ
   Revenue: R(Q) = AQ − BQ²
   MR(Q) = A − 2BQ  (same intercept, twice the slope)
   Decomposition: MR = P(Q) − B·Q  (gain P, lose Q·ΔP)              */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { Q: 15, A: 100, B: 2 };
    var sliders = {};

    sliders.Q = MT.addSlider('controls-15', {
      label: 'Quantity (Q)', min: 0, max: state.A / state.B, value: state.Q, step: 0.5,
      format: function (v) { return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1); },
      onChange: function (v) { state.Q = v; clampAndUpdate(); }
    });

    sliders.A = MT.addSlider('controls-15', {
      label: 'Demand intercept (A)', min: 50, max: 200, value: state.A, step: 5,
      onChange: function (v) { state.A = v; render(); }
    });

    sliders.B = MT.addSlider('controls-15', {
      label: 'Demand slope (B)', min: 1, max: 4, value: state.B, step: 0.5,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.B = v; render(); }
    });

    var chartTop, chartBot, xsT, ysT, xsB, ysB, dynTop, dynBot;

    function clampAndUpdate() {
      var qMax = state.A / state.B;
      if (state.Q > qMax) { state.Q = qMax; sliders.Q.setValue(state.Q); }
      sliders.Q.input.attr('max', qMax);
      update();
    }

    function ensureBot() {
      if (!document.getElementById('chart-15b')) {
        var d = document.createElement('div');
        d.id = 'chart-15b'; d.className = 'micro-chart';
        document.getElementById('chart-15').parentNode.appendChild(d);
      }
    }

    function setup() {
      ensureBot();
      var A = state.A, B = state.B;
      var qMax = A / B;
      var rMax = A * A / (4 * B) * 1.15;

      var mT = { top: 25, right: 40, bottom: 35, left: 65 };
      var mB = { top: 25, right: 40, bottom: 50, left: 65 };

      chartTop = MT.createChart('chart-15',  { height: 260, margin: mT });
      chartBot = MT.createChart('chart-15b', { height: 220, margin: mB });

      xsT = d3.scaleLinear().domain([0, qMax * 1.05]).range([0, chartTop.innerWidth]);
      ysT = d3.scaleLinear().domain([0, A * 1.05]).range([chartTop.innerHeight, 0]);
      xsB = d3.scaleLinear().domain([0, qMax * 1.05]).range([0, chartBot.innerWidth]);
      ysB = d3.scaleLinear().domain([Math.min(0, -A * 0.15), rMax]).range([chartBot.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var A = state.A, B = state.B, qMax = A / B;

      /* clamp Q */
      if (state.Q > qMax) { state.Q = qMax; sliders.Q.setValue(state.Q); }
      sliders.Q.input.attr('max', qMax);

      /* ===== Top: P vs Q ===== */
      MT.drawAxes(chartTop, xsT, ysT, 'Quantity (Q)', 'Price (P)', { xTicks: 6, yTicks: 5 });

      /* Demand line */
      MT.drawCurve(chartTop.plotArea,
        function (q) { return A - B * q; },
        [0, qMax], xsT, ysT, { color: colors.demand, strokeWidth: 2.5 });
      chartTop.plotArea.append('text')
        .attr('x', xsT(qMax * 0.92)).attr('y', ysT(A * 0.05))
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold').text('D');

      /* MR line */
      var qMR0 = A / (2 * B); // where MR hits zero
      MT.drawCurve(chartTop.plotArea,
        function (q) { return A - 2 * B * q; },
        [0, qMR0], xsT, ysT, { color: colors.revenue, strokeWidth: 2, dashed: true });
      chartTop.plotArea.append('text')
        .attr('x', xsT(qMR0 * 0.92)).attr('y', ysT(A * 0.05))
        .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold').text('MR');

      /* ===== Bottom: Revenue parabola ===== */
      MT.drawAxes(chartBot, xsB, ysB, 'Quantity (Q)', 'Revenue ($)', { xTicks: 6, yTicks: 5 });
      MT.drawCurve(chartBot.plotArea,
        function (q) { return q * (A - B * q); },
        [0, qMax], xsB, ysB, { color: colors.revenue, strokeWidth: 2.5 });

      /* peak marker */
      var qPeak = A / (2 * B);
      var rPeak = qPeak * (A - B * qPeak);
      MT.addEqMarker(chartBot.plotArea, qPeak, rPeak, xsB, ysB, {
        color: colors.revenue,
        xLabel: 'Q*=' + MT.fmt(qPeak, 1),
        yLabel: 'R*=' + MT.fmt(rPeak, 0),
        r: 4
      });

      dynTop = chartTop.plotArea.append('g');
      dynBot = chartBot.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynTop) { render(); return; }
      dynTop.selectAll('*').remove();
      dynBot.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var Q = state.Q, A = state.A, B = state.B;
      var P = Math.max(0, A - B * Q);
      var R = Q * P;
      var MR = A - 2 * B * Q;
      var qMax = A / B;
      var qFmt = Q % 1 === 0 ? MT.fmt(Q, 0) : MT.fmt(Q, 1);

      /* ===== Top chart dynamic ===== */
      if (Q > 0 && Q <= qMax) {
        /* Revenue rectangle (faded) */
        dynTop.append('rect')
          .attr('x', xsT(0)).attr('y', ysT(P))
          .attr('width', xsT(Q) - xsT(0))
          .attr('height', ysT(0) - ysT(P))
          .attr('fill', colors.revenue).attr('opacity', 0.12);

        /* Gain rectangle: selling 1 more at price P (slim) */
        var dQ = qMax * 0.012;
        if (Q + dQ <= qMax) {
          dynTop.append('rect')
            .attr('x', xsT(Q)).attr('y', ysT(P))
            .attr('width', xsT(Q + dQ) - xsT(Q))
            .attr('height', ysT(0) - ysT(P))
            .attr('fill', colors.positive).attr('opacity', 0.45)
            .attr('stroke', colors.positive).attr('stroke-width', 1);
          dynTop.append('text')
            .attr('x', xsT(Q + dQ) + 4).attr('y', ysT(P / 2) + 4)
            .style('fill', colors.positive).style('font-size', '10px').style('font-weight', 'bold')
            .text('Gain: P');
        }

        /* Loss rectangle: price drops on existing units (slim) */
        var dP = B * dQ;
        if (dP > 0 && Q > 0) {
          dynTop.append('rect')
            .attr('x', xsT(0)).attr('y', ysT(P))
            .attr('width', xsT(Q) - xsT(0))
            .attr('height', ysT(P - dP) - ysT(P))
            .attr('fill', colors.negative).attr('opacity', 0.45)
            .attr('stroke', colors.negative).attr('stroke-width', 1);
          dynTop.append('text')
            .attr('x', xsT(Q / 2)).attr('y', ysT(P - dP / 2) + 4)
            .attr('text-anchor', 'middle')
            .style('fill', colors.negative).style('font-size', '10px').style('font-weight', 'bold')
            .text('Lose: Q\u00B7\u0394P');
        }

        /* Vertical dashed at current Q */
        dynTop.append('line')
          .attr('x1', xsT(Q)).attr('y1', ysT(0))
          .attr('x2', xsT(Q)).attr('y2', ysT(P))
          .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
        /* Horizontal dashed at current P */
        dynTop.append('line')
          .attr('x1', xsT(0)).attr('y1', ysT(P))
          .attr('x2', xsT(Q)).attr('y2', ysT(P))
          .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
        dynTop.append('circle')
          .attr('cx', xsT(Q)).attr('cy', ysT(P))
          .attr('r', 5).attr('fill', colors.equilibrium);
      }

      /* ===== Bottom chart dynamic ===== */
      if (Q >= 0 && Q <= qMax) {
        dynBot.append('circle')
          .attr('cx', xsB(Q)).attr('cy', ysB(R))
          .attr('r', 5).attr('fill', colors.equilibrium);
        dynBot.append('line')
          .attr('x1', xsB(Q)).attr('y1', ysB(0))
          .attr('x2', xsB(Q)).attr('y2', ysB(R))
          .attr('stroke', colors.equilibrium).attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
        dynBot.append('line')
          .attr('x1', xsB(0)).attr('y1', ysB(R))
          .attr('x2', xsB(Q)).attr('y2', ysB(R))
          .attr('stroke', colors.equilibrium).attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
      }

      /* Info panel */
      var gain = P;
      var lose = B * Q;
      d3.select('#info-15').html(
        '<strong>Q:</strong> ' + qFmt +
        '&ensp;<strong>P(Q):</strong> $' + MT.fmt(P, 1) +
        '&ensp;<strong>Rev:</strong> $' + MT.fmt(R, 0) +
        '<br><strong>MR:</strong> ' + MT.fmt(MR, 1) +
        '&ensp;= Gain $' + MT.fmt(gain, 1) +
        ' \u2212 Lose $' + MT.fmt(lose, 1) +
        '<br><span style="color:' + colors.positive + '">\u25A0 Gain: P(Q) = $' + MT.fmt(gain, 1) + '</span>' +
        '&ensp;<span style="color:' + colors.negative + '">\u25A0 Lose: Q\u00B7B = $' + MT.fmt(lose, 1) + '</span>'
      );

      MT.updateMath('math-15',
        '\\text{MR}(Q) = \\underbrace{P(Q)}_{\\text{Gain}} + \\underbrace{Q\\cdot P\'(Q)}_{\\text{Lose}}' +
        ' = (' + MT.fmt(A, 0) + '-' + MT.fmt(B, 1) + '\\cdot' + qFmt + ')' +
        ' + ' + qFmt + '(-' + MT.fmt(B, 1) + ')' +
        ' = ' + MT.fmt(MR, 1));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
