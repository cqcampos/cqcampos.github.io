/* Viz 18 — Isoquants & Marginal Products
   Cobb-Douglas: f(L,K) = L^a * K^b
   Isoquant for output Q: K(L) = (Q / L^a)^(1/b)
   MPL = a * L^(a-1) * K^b
   MPK = b * L^a * K^(b-1)
   MRTS = MPL/MPK = (a/b)*(K/L)                                      */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { L: 3, a: 0.5, b: 0.5 };

    MT.addSlider('controls-18', {
      label: 'Labor (L)', min: 0.5, max: 10, value: state.L, step: 0.1,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.L = v; update(); }
    });

    MT.addSlider('controls-18', {
      label: 'Exponent a (labor)', min: 0.1, max: 0.9, value: state.a, step: 0.05,
      format: function (v) { return v.toFixed(2); },
      onChange: function (v) { state.a = v; render(); }
    });

    MT.addSlider('controls-18', {
      label: 'Exponent b (capital)', min: 0.1, max: 0.9, value: state.b, step: 0.05,
      format: function (v) { return v.toFixed(2); },
      onChange: function (v) { state.b = v; render(); }
    });

    var chart, xScale, yScale, dynamicG;
    var Lmax = 12, Kmax = 12;

    /* Production & isoquant helpers */
    function f(L, K) { return Math.pow(L, state.a) * Math.pow(K, state.b); }
    function isoK(Q, L) {
      if (L <= 0) return Infinity;
      var base = Q / Math.pow(L, state.a);
      if (base <= 0) return 0;
      return Math.pow(base, 1 / state.b);
    }

    /* Choose isoquant levels that look good */
    function isoLevels() {
      /* Pick Q values so isoquants are visible in [0, Lmax] x [0, Kmax] */
      var midQ = f(Lmax / 2, Kmax / 2);
      var levels = [];
      for (var i = 1; i <= 5; i++) {
        levels.push(midQ * i / 3);
      }
      return levels;
    }

    function setup() {
      chart  = MT.createChart('chart-18', { height: 450 });
      xScale = d3.scaleLinear().domain([0, Lmax]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, Kmax]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale, 'Labor (L)', 'Capital (K)', { xTicks: 6, yTicks: 6 });

      /* Draw isoquants */
      var levels = isoLevels();
      var isoCols = [colors.textLight, colors.demand, colors.supply, colors.revenue, colors.social];

      levels.forEach(function (Q, idx) {
        /* Find L range where K is within bounds */
        var Lmin = 0.05;
        var Lhi = Lmax;
        /* Trim: K must be <= Kmax */
        var Llow = Math.pow(Q / Math.pow(Kmax, state.b), 1 / state.a);
        if (Llow > Lmin) Lmin = Llow;

        MT.drawCurve(chart.plotArea,
          function (l) { return isoK(Q, l); },
          [Lmin, Lhi], xScale, yScale,
          { color: isoCols[idx % isoCols.length], strokeWidth: 1.8, nPoints: 300 });

        /* Label the isoquant */
        var labelL = Lhi * 0.9;
        var labelK = isoK(Q, labelL);
        if (labelK > 0 && labelK < Kmax) {
          chart.plotArea.append('text')
            .attr('x', xScale(labelL)).attr('y', yScale(labelK) - 6)
            .style('fill', isoCols[idx % isoCols.length])
            .style('font-size', '10px').style('font-weight', 'bold')
            .text('Q=' + MT.fmt(Q, 1));
        }
      });

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var a = state.a, b = state.b, L = state.L;

      /* Which isoquant does the point sit on? Use the middle level */
      var levels = isoLevels();
      var Qsel = levels[Math.floor(levels.length / 2)]; /* middle isoquant */
      var K = isoK(Qsel, L);

      if (K > Kmax || K <= 0 || !isFinite(K)) {
        d3.select('#info-18').html('<em>Point out of visible range — adjust L.</em>');
        return;
      }

      /* MPL, MPK, MRTS */
      var MPL  = a * Math.pow(L, a - 1) * Math.pow(K, b);
      var MPK  = b * Math.pow(L, a) * Math.pow(K, b - 1);
      var MRTS = MPL / MPK;  /* = (a/b)*(K/L) */

      /* Dashed crosshairs */
      dynamicG.append('line')
        .attr('x1', xScale(L)).attr('y1', yScale(0))
        .attr('x2', xScale(L)).attr('y2', yScale(K))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
      dynamicG.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(K))
        .attr('x2', xScale(L)).attr('y2', yScale(K))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 1).attr('stroke-dasharray', '4,3');

      /* Tangent line (slope = -MRTS in K-L space, i.e. dK/dL = -MRTS) */
      var tangLen = 2.5;
      var dL = tangLen;
      var dK = -MRTS * dL;
      var L1 = L - dL, K1 = K - dK;
      var L2 = L + dL, K2 = K + dK;
      dynamicG.append('line')
        .attr('x1', xScale(L1)).attr('y1', yScale(K1))
        .attr('x2', xScale(L2)).attr('y2', yScale(K2))
        .attr('stroke', colors.priceLine).attr('stroke-width', 2).attr('opacity', 0.8);

      dynamicG.append('text')
        .attr('x', xScale(L2) + 4).attr('y', yScale(K2))
        .style('fill', colors.priceLine).style('font-size', '10px').style('font-weight', 'bold')
        .text('slope = \u2212MRTS');

      /* MPL arrow (rightward) */
      var arrowScale = 0.8;
      var mplLen = MPL * arrowScale;
      if (mplLen > 4) mplLen = 4;
      drawArrow(dynamicG, xScale(L), yScale(K), xScale(L + mplLen), yScale(K), colors.positive);
      dynamicG.append('text')
        .attr('x', xScale(L + mplLen) + 4).attr('y', yScale(K) + 4)
        .style('fill', colors.positive).style('font-size', '10px').style('font-weight', 'bold')
        .text('MPL');

      /* MPK arrow (upward) */
      var mpkLen = MPK * arrowScale;
      if (mpkLen > 4) mpkLen = 4;
      drawArrow(dynamicG, xScale(L), yScale(K), xScale(L), yScale(K + mpkLen), colors.demand);
      dynamicG.append('text')
        .attr('x', xScale(L) + 6).attr('y', yScale(K + mpkLen) - 4)
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('MPK');

      /* Point dot */
      dynamicG.append('circle')
        .attr('cx', xScale(L)).attr('cy', yScale(K))
        .attr('r', 5).attr('fill', colors.equilibrium);

      /* Info panel */
      var dimMPL = a < 1 ? 'Yes' : 'No';
      var dimMPK = b < 1 ? 'Yes' : 'No';
      d3.select('#info-18').html(
        '<strong>L:</strong> ' + MT.fmt(L, 1) +
        '&ensp;<strong>K:</strong> ' + MT.fmt(K, 2) +
        '&ensp;<strong>Q:</strong> ' + MT.fmt(Qsel, 2) +
        '<br><strong>MPL:</strong> ' + MT.fmt(MPL, 3) +
        '&ensp;<strong>MPK:</strong> ' + MT.fmt(MPK, 3) +
        '<br><strong>MRTS:</strong> (a/b)\u00B7(K/L) = ' + MT.fmt(MRTS, 3) +
        '<br>Diminishing MPL (a&lt;1): ' + dimMPL +
        '&ensp;Diminishing MPK (b&lt;1): ' + dimMPK
      );

      /* Math */
      var el = document.getElementById('math-18');
      if (el) {
        el.innerHTML =
          '\\(\\text{MRTS} = \\frac{MPL}{MPK} = \\frac{a}{b}\\cdot\\frac{K}{L} = ' +
          '\\frac{' + MT.fmt(a, 2) + '}{' + MT.fmt(b, 2) + '}\\cdot\\frac{' + MT.fmt(K, 2) + '}{' + MT.fmt(L, 1) + '} = ' +
          MT.fmt(MRTS, 3) + '\\)';
        if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([el]); }
      }
    }

    /* Simple arrow drawing helper */
    function drawArrow(g, x1, y1, x2, y2, color) {
      g.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', color).attr('stroke-width', 2.5);
      /* arrowhead */
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      var ux = dx / len, uy = dy / len;
      var headLen = 7;
      var headW = 3.5;
      var bx = x2 - ux * headLen, by = y2 - uy * headLen;
      var p1x = bx - uy * headW, p1y = by + ux * headW;
      var p2x = bx + uy * headW, p2y = by - ux * headW;
      g.append('polygon')
        .attr('points', x2 + ',' + y2 + ' ' + p1x + ',' + p1y + ' ' + p2x + ',' + p2y)
        .attr('fill', color);
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
