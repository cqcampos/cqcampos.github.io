/* Viz 22 — Returns to Scale & the Shape of Costs
   Cobb-Douglas f(L,K) = L^a * K^b  with equal input prices (normalized).
   a+b determines RTS:  CRS (=1), DRS (<1), IRS (>1).
   Cost function: C(Q) = c * Q^(1/(a+b))  where c is a constant depending on prices.
   MC(Q) = c/(a+b) * Q^(1/(a+b) - 1)
   Left panel:  Total Cost C(Q)
   Right panel: Marginal Cost MC(Q)                                              */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { a: 0.5, b: 0.5 };

    MT.addSlider('controls-22', {
      label: 'Exponent a (labor)', min: 0.2, max: 1.0, value: state.a, step: 0.05,
      format: function (v) { return v.toFixed(2); },
      onChange: function (v) { state.a = v; render(); }
    });

    MT.addSlider('controls-22', {
      label: 'Exponent b (capital)', min: 0.2, max: 1.0, value: state.b, step: 0.05,
      format: function (v) { return v.toFixed(2); },
      onChange: function (v) { state.b = v; render(); }
    });

    MT.addDropdown('controls-22', {
      label: 'Presets',
      value: 'custom',
      options: [
        { value: 'custom', label: 'Custom' },
        { value: 'crs',  label: 'CRS (a+b = 1)' },
        { value: 'drs',  label: 'DRS (a+b = 0.8)' },
        { value: 'irs',  label: 'IRS (a+b = 1.4)' }
      ],
      onChange: function (v) {
        if (v === 'crs')  { state.a = 0.5; state.b = 0.5; }
        if (v === 'drs')  { state.a = 0.4; state.b = 0.4; }
        if (v === 'irs')  { state.a = 0.7; state.b = 0.7; }
        if (v !== 'custom') render();
      }
    });

    /* Create two chart containers */
    var chartEl = document.getElementById('chart-22');
    var leftDiv = document.createElement('div');
    leftDiv.id = 'chart-22-tc';
    leftDiv.className = 'micro-chart';
    leftDiv.style.display = 'inline-block';
    leftDiv.style.width = '50%';
    leftDiv.style.verticalAlign = 'top';
    var rightDiv = document.createElement('div');
    rightDiv.id = 'chart-22-mc';
    rightDiv.className = 'micro-chart';
    rightDiv.style.display = 'inline-block';
    rightDiv.style.width = '50%';
    rightDiv.style.verticalAlign = 'top';
    chartEl.appendChild(leftDiv);
    chartEl.appendChild(rightDiv);

    function render() {
      var colors = MT.getColors();
      var s = state.a + state.b;
      var r = 1 / s; /* cost exponent: C(Q) ~ Q^r */
      var cScale = 2; /* scale constant for visibility */

      var Qmax = 20;
      var TCmax = cScale * Math.pow(Qmax, r) * 1.15;
      var MCmax;
      if (r <= 1) {
        MCmax = cScale * r * Math.pow(Qmax, r - 1) * 2;
      } else {
        MCmax = cScale * r * Math.pow(Qmax, r - 1) * 1.3;
      }
      MCmax = Math.max(MCmax, 3);

      /* TC(Q) and MC(Q) */
      function TC(Q) { return cScale * Math.pow(Q, r); }
      function MC(Q) {
        if (Q <= 0) return r <= 1 ? (r < 1 ? Infinity : cScale * r) : 0;
        return cScale * r * Math.pow(Q, r - 1);
      }

      /* RTS label and color */
      var rtsLabel, rtsColor;
      if (Math.abs(s - 1) < 0.02) {
        rtsLabel = 'Constant Returns to Scale (a+b \u2248 1)';
        rtsColor = colors.demand;
      } else if (s < 1) {
        rtsLabel = 'Decreasing Returns to Scale (a+b = ' + MT.fmt(s, 2) + ' < 1)';
        rtsColor = colors.supply;
      } else {
        rtsLabel = 'Increasing Returns to Scale (a+b = ' + MT.fmt(s, 2) + ' > 1)';
        rtsColor = colors.positive;
      }

      /* Left panel: Total Cost */
      var tcChart = MT.createChart('chart-22-tc', {
        width: 350, height: 320, margin: { top: 25, right: 20, bottom: 50, left: 55 }
      });
      var xTC = d3.scaleLinear().domain([0, Qmax]).range([0, tcChart.innerWidth]);
      var yTC = d3.scaleLinear().domain([0, TCmax]).range([tcChart.innerHeight, 0]);
      MT.drawAxes(tcChart, xTC, yTC, 'Quantity (Q)', 'Total Cost C(Q)', { xTicks: 5, yTicks: 5 });

      /* Title */
      tcChart.plotArea.append('text')
        .attr('x', tcChart.innerWidth / 2).attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Total Cost');

      MT.drawCurve(tcChart.plotArea, TC, [0.01, Qmax], xTC, yTC,
        { color: rtsColor, strokeWidth: 2.5, nPoints: 200 });

      /* Right panel: Marginal Cost */
      var mcChart = MT.createChart('chart-22-mc', {
        width: 350, height: 320, margin: { top: 25, right: 20, bottom: 50, left: 55 }
      });
      var xMC = d3.scaleLinear().domain([0, Qmax]).range([0, mcChart.innerWidth]);
      var yMC = d3.scaleLinear().domain([0, MCmax]).range([mcChart.innerHeight, 0]);
      MT.drawAxes(mcChart, xMC, yMC, 'Quantity (Q)', 'Marginal Cost MC(Q)', { xTicks: 5, yTicks: 5 });

      mcChart.plotArea.append('text')
        .attr('x', mcChart.innerWidth / 2).attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Marginal Cost');

      MT.drawCurve(mcChart.plotArea, MC, [0.2, Qmax], xMC, yMC,
        { color: rtsColor, strokeWidth: 2.5, nPoints: 200 });

      /* Info panel */
      var mcDesc;
      if (Math.abs(s - 1) < 0.02) {
        mcDesc = 'MC is <strong>constant</strong> \u2014 each extra unit costs the same.';
      } else if (s < 1) {
        mcDesc = 'MC is <strong>increasing</strong> \u2014 each extra unit costs more. The firm faces rising costs as it scales.';
      } else {
        mcDesc = 'MC is <strong>decreasing</strong> \u2014 each extra unit costs less. The firm benefits from scale.';
      }

      d3.select('#info-22').html(
        '<strong style="color:' + rtsColor + '">' + rtsLabel + '</strong>' +
        '<br>a + b = ' + MT.fmt(s, 2) +
        ', cost exponent 1/(a+b) = ' + MT.fmt(r, 2) +
        '<br>' + mcDesc
      );

      /* Math panel */
      var el = document.getElementById('math-22');
      if (el) {
        el.innerHTML =
          '\\(C(Q) \\propto Q^{1/(a+b)} = Q^{' + MT.fmt(r, 2) + '}\\)' +
          '&emsp;' +
          '\\(MC(Q) \\propto Q^{1/(a+b)-1} = Q^{' + MT.fmt(r - 1, 2) + '}\\)';
        if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([el]); }
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
