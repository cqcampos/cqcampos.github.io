/* Viz 5 — Revenue and Unit Elasticity
   Slide model: Q_D = 100 − P  ⇒  R(P) = P(100−P) = 100P − P².
   Revenue maximised at ε = −1, i.e. P = 50, Q = 50, R = 2 500.
   Scenario: online movie streaming (zero marginal cost after buying rights).
   R'(P) = Q(ε+1); R'>0 when |ε|<1, R'<0 when |ε|>1.              */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { price: 30, a: 100, b: 1 };
    var sliders = {};

    sliders.price = MT.addSlider('controls-05', {
      label: 'Price (P)', min: 1, max: 95, value: state.price, step: 1,
      format: function (v) { return '$' + v; },
      onChange: function (v) { state.price = v; update(); }
    });

    sliders.a = MT.addSlider('controls-05', {
      label: 'Demand intercept (a)', min: 50, max: 200, value: state.a, step: 5,
      onChange: function (v) { state.a = v; render(); }
    });

    sliders.b = MT.addSlider('controls-05', {
      label: 'Demand slope (b)', min: 0.5, max: 3, value: state.b, step: 0.1,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.b = v; render(); }
    });

    var chartTop, chartBot, xsT, ysT, xsB, ysB, dynTop, dynBot;

    function ensureBot() {
      if (!document.getElementById('chart-05b')) {
        var d = document.createElement('div');
        d.id = 'chart-05b'; d.className = 'micro-chart';
        document.getElementById('chart-05').parentNode.appendChild(d);
      }
    }

    function setup() {
      ensureBot();
      var a = state.a, b = state.b;
      var pMax = a / b;
      var rMax = a * a / (4 * b) * 1.15;

      var mT = { top: 25, right: 40, bottom: 35, left: 65 };
      var mB = { top: 25, right: 40, bottom: 50, left: 65 };

      chartTop = MT.createChart('chart-05',  { height: 240, margin: mT });
      chartBot = MT.createChart('chart-05b', { height: 230, margin: mB });

      xsT = d3.scaleLinear().domain([0, pMax * 1.05]).range([0, chartTop.innerWidth]);
      ysT = d3.scaleLinear().domain([0, a * 1.05]).range([chartTop.innerHeight, 0]);
      xsB = d3.scaleLinear().domain([0, pMax * 1.05]).range([0, chartBot.innerWidth]);
      ysB = d3.scaleLinear().domain([0, rMax]).range([chartBot.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var a = state.a, b = state.b, pMax = a / b;
      var pStar = a / (2 * b); // revenue-maximising price

      /* ===== Top: Demand with elasticity colouring ===== */
      MT.drawAxes(chartTop, xsT, ysT, 'Price ($)', 'Quantity', { xTicks: 6, yTicks: 5 });

      var nSeg = 80;
      for (var i = 0; i < nSeg; i++) {
        var p1 = (pMax / nSeg) * i, p2 = (pMax / nSeg) * (i + 1);
        var q1 = a - b * p1, q2 = a - b * p2;
        var pm = (p1 + p2) / 2, qm = a - b * pm;
        var eps = qm > 0 ? Math.abs(b * pm / qm) : 0;
        var hue = eps > 1 ? 210 : eps < 1 ? 0 : 60;
        chartTop.plotArea.append('line')
          .attr('x1', xsT(p1)).attr('y1', ysT(q1))
          .attr('x2', xsT(p2)).attr('y2', ysT(q2))
          .attr('stroke', 'hsl(' + hue + ',60%,45%)').attr('stroke-width', 3);
      }

      /* unit-elasticity dashed line */
      chartTop.plotArea.append('line')
        .attr('x1', xsT(pStar)).attr('y1', ysT(0))
        .attr('x2', xsT(pStar)).attr('y2', ysT(a - b * pStar))
        .attr('stroke', colors.highlight).attr('stroke-dasharray', '5,3').attr('stroke-width', 1);
      chartTop.plotArea.append('text')
        .attr('x', xsT(pStar) + 4).attr('y', ysT(a * 0.85))
        .style('fill', colors.highlight).style('font-size', '10px').text('|\u03B5|=1');

      /* ===== Bottom: Revenue curve ===== */
      MT.drawAxes(chartBot, xsB, ysB, 'Price ($)', 'Revenue ($)', { xTicks: 6, yTicks: 5 });
      MT.drawCurve(chartBot.plotArea,
        function (p) { return p * (a - b * p); },
        [0, pMax], xsB, ysB,
        { color: colors.revenue, strokeWidth: 2.5 });

      var rPeak = pStar * (a - b * pStar);
      MT.addEqMarker(chartBot.plotArea, pStar, rPeak, xsB, ysB, {
        color: colors.revenue,
        xLabel: 'P*=' + MT.fmt(pStar, 1),
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
      var P = state.price, a = state.a, b = state.b;
      var Q = Math.max(0, a - b * P);
      var R = P * Q;
      var pMax = a / b;

      /* Top: revenue rectangle */
      if (Q > 0 && P > 0 && P < pMax) {
        dynTop.append('rect')
          .attr('x', xsT(0)).attr('y', ysT(Q))
          .attr('width', xsT(P) - xsT(0))
          .attr('height', ysT(0) - ysT(Q))
          .attr('fill', colors.revenue).attr('opacity', 0.18)
          .attr('stroke', colors.revenue).attr('stroke-width', 1);
        dynTop.append('text')
          .attr('x', xsT(P / 2)).attr('y', ysT(Q / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold')
          .text('R=' + MT.fmt(R, 0));
      }

      dynTop.append('line')
        .attr('x1', xsT(P)).attr('y1', ysT(0))
        .attr('x2', xsT(P)).attr('y2', ysT(Math.max(0, Q)))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 2).attr('stroke-dasharray', '4,3');

      /* Bottom: point on revenue curve */
      if (P >= 0 && P <= pMax) {
        dynBot.append('circle')
          .attr('cx', xsB(P)).attr('cy', ysB(R))
          .attr('r', 5).attr('fill', colors.equilibrium);
        dynBot.append('line')
          .attr('x1', xsB(P)).attr('y1', ysB(0))
          .attr('x2', xsB(P)).attr('y2', ysB(R))
          .attr('stroke', colors.equilibrium).attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
      }

      var eps = Q > 0 ? Math.abs(b * P / Q) : Infinity;
      var lbl = eps > 1.05 ? 'elastic' : eps < 0.95 ? 'inelastic' : '\u2248 unit elastic';

      d3.select('#info-05').html(
        '<strong>P:</strong> $' + MT.fmt(P, 0) +
        '&ensp;<strong>Q:</strong> ' + MT.fmt(Q, 0) +
        '&ensp;<strong>R:</strong> $' + MT.fmt(R, 0) +
        '<br><strong>|\u03B5|:</strong> ' + MT.fmt(eps, 2) + ' (' + lbl + ')' +
        '<br>R\u2032(P) = Q(\u03B5+1) ' + (eps > 1 ? '< 0 \u2192 lower P to raise R' :
          eps < 1 ? '> 0 \u2192 raise P to raise R' : '= 0 \u2192 revenue maximised')
      );

      var pStar = a / (2 * b);
      MT.updateMath('math-05',
        'R(P) = P(a - bP) = ' + P + '(' + a + '-' + b + '\\cdot' + P + ')=' + MT.fmt(R, 0) +
        ',\\quad P^*_{\\max R} = \\tfrac{a}{2b} = ' + MT.fmt(pStar, 1));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
