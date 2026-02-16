/* Viz 23 — Short-Run vs Long-Run Costs
   Lecture example: f(L,K) = 6*sqrt(L*K),  r_L = 10, r_K = 40.
   Long-run: CRS => C_LR(Q) = (20/3)*Q,  MC_LR = 20/3 (constant).
   Short-run: K fixed at K_0 => L = Q^2/(36*K_0),
     C_SR(Q) = r_K*K_0 + r_L*Q^2/(36*K_0).
   SR tangent to LR at Q_0 where K_0 was optimal: K_0 = Q_0/12.
   Left panel:  Total Cost (LR line, SR curve)
   Right panel: Marginal Cost (flat LR MC, rising SR MC)              */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { Q0: 12, Qnew: 12 };
    var rL = 10, rK = 40;

    MT.addSlider('controls-23', {
      label: 'Current production Q\u2080 (determines fixed K)', min: 2, max: 30, value: state.Q0, step: 1,
      format: function (v) { return v.toFixed(0); },
      onChange: function (v) { state.Q0 = v; state.Qnew = v; render(); }
    });

    MT.addSlider('controls-23', {
      label: 'New desired quantity Q', min: 1, max: 35, value: state.Qnew, step: 0.5,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.Qnew = v; update(); }
    });

    /* Create two chart containers */
    var chartEl = document.getElementById('chart-23');
    var leftDiv = document.createElement('div');
    leftDiv.id = 'chart-23-tc';
    leftDiv.className = 'micro-chart';
    leftDiv.style.display = 'inline-block';
    leftDiv.style.width = '50%';
    leftDiv.style.verticalAlign = 'top';
    var rightDiv = document.createElement('div');
    rightDiv.id = 'chart-23-mc';
    rightDiv.className = 'micro-chart';
    rightDiv.style.display = 'inline-block';
    rightDiv.style.width = '50%';
    rightDiv.style.verticalAlign = 'top';
    chartEl.appendChild(leftDiv);
    chartEl.appendChild(rightDiv);

    var tcChart, mcChart, xTC, yTC, xMC, yMC, dynamicTC, dynamicMC;

    /* Cost functions */
    var MCLR = 20 / 3; /* ~6.67 */
    function CLR(Q) { return MCLR * Q; }
    function K0fn() { return state.Q0 / 12; }
    function CSR(Q) {
      var K0 = K0fn();
      return rK * K0 + rL * Q * Q / (36 * K0);
    }
    function MCSR(Q) {
      var K0 = K0fn();
      return 2 * rL * Q / (36 * K0);
    }

    var Qmax = 36;
    var TCmax, MCmax;

    function setup() {
      TCmax = Math.max(CLR(Qmax), CSR(Qmax)) * 1.1;
      MCmax = Math.max(MCSR(Qmax), MCLR) * 1.15;

      tcChart = MT.createChart('chart-23-tc', {
        width: 350, height: 320, margin: { top: 25, right: 20, bottom: 50, left: 60 }
      });
      xTC = d3.scaleLinear().domain([0, Qmax]).range([0, tcChart.innerWidth]);
      yTC = d3.scaleLinear().domain([0, TCmax]).range([tcChart.innerHeight, 0]);

      mcChart = MT.createChart('chart-23-mc', {
        width: 350, height: 320, margin: { top: 25, right: 20, bottom: 50, left: 60 }
      });
      xMC = d3.scaleLinear().domain([0, Qmax]).range([0, mcChart.innerWidth]);
      yMC = d3.scaleLinear().domain([0, MCmax]).range([mcChart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      /* Titles */
      MT.drawAxes(tcChart, xTC, yTC, 'Quantity (Q)', 'Total Cost ($)', { xTicks: 6, yTicks: 5 });
      tcChart.plotArea.append('text')
        .attr('x', tcChart.innerWidth / 2).attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Total Cost');

      MT.drawAxes(mcChart, xMC, yMC, 'Quantity (Q)', 'Marginal Cost ($)', { xTicks: 6, yTicks: 5 });
      mcChart.plotArea.append('text')
        .attr('x', mcChart.innerWidth / 2).attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Marginal Cost');

      /* LR total cost (line) */
      MT.drawCurve(tcChart.plotArea, CLR, [0, Qmax], xTC, yTC,
        { color: colors.demand, strokeWidth: 2.5, nPoints: 100 });
      tcChart.plotArea.append('text')
        .attr('x', xTC(Qmax * 0.85)).attr('y', yTC(CLR(Qmax * 0.85)) - 8)
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('LR Cost');

      /* SR total cost (parabola) */
      MT.drawCurve(tcChart.plotArea, CSR, [0, Qmax], xTC, yTC,
        { color: colors.supply, strokeWidth: 2.5, nPoints: 200 });
      var srLabelQ = Qmax * 0.55;
      tcChart.plotArea.append('text')
        .attr('x', xTC(srLabelQ)).attr('y', yTC(CSR(srLabelQ)) - 8)
        .style('fill', colors.supply).style('font-size', '10px').style('font-weight', 'bold')
        .text('SR Cost (K\u2080=' + MT.fmt(K0fn(), 2) + ')');

      /* LR MC (flat line) */
      mcChart.plotArea.append('line')
        .attr('x1', xMC(0)).attr('y1', yMC(MCLR))
        .attr('x2', xMC(Qmax)).attr('y2', yMC(MCLR))
        .attr('stroke', colors.demand).attr('stroke-width', 2.5);
      mcChart.plotArea.append('text')
        .attr('x', xMC(Qmax) - 5).attr('y', yMC(MCLR) - 8)
        .attr('text-anchor', 'end')
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('LR MC = $' + MT.fmt(MCLR, 2));

      /* SR MC (linear, rising) */
      MT.drawCurve(mcChart.plotArea, MCSR, [0, Qmax], xMC, yMC,
        { color: colors.supply, strokeWidth: 2.5, nPoints: 100 });
      mcChart.plotArea.append('text')
        .attr('x', xMC(Qmax * 0.75)).attr('y', yMC(MCSR(Qmax * 0.75)) - 8)
        .style('fill', colors.supply).style('font-size', '10px').style('font-weight', 'bold')
        .text('SR MC');

      dynamicTC = tcChart.plotArea.append('g');
      dynamicMC = mcChart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicTC) { render(); return; }
      dynamicTC.selectAll('*').remove();
      dynamicMC.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var Q0 = state.Q0, Qn = state.Qnew;

      /* Tangency point on TC panel: SR = LR at Q0 */
      dynamicTC.append('circle')
        .attr('cx', xTC(Q0)).attr('cy', yTC(CLR(Q0)))
        .attr('r', 5).attr('fill', colors.positive).attr('stroke', '#fff').attr('stroke-width', 2);
      dynamicTC.append('text')
        .attr('x', xTC(Q0) + 8).attr('y', yTC(CLR(Q0)) + 16)
        .style('fill', colors.positive).style('font-size', '10px').style('font-weight', 'bold')
        .text('Tangency at Q\u2080=' + Q0);

      /* Intersection on MC panel: SR MC = LR MC at Q0 */
      dynamicMC.append('circle')
        .attr('cx', xMC(Q0)).attr('cy', yMC(MCLR))
        .attr('r', 5).attr('fill', colors.positive).attr('stroke', '#fff').attr('stroke-width', 2);

      /* If Qnew != Q0, show the cost comparison */
      if (Math.abs(Qn - Q0) > 0.3) {
        var cSR = CSR(Qn);
        var cLR = CLR(Qn);
        var penalty = cSR - cLR;

        /* Shaded region between SR and LR on TC panel */
        var qLo = Math.min(Q0, Qn);
        var qHi = Math.max(Q0, Qn);
        var pts = [];
        var nPts = 60;
        var step = (qHi - qLo) / nPts;
        /* SR curve (top) */
        for (var q = qLo; q <= qHi; q += step) {
          pts.push([xTC(q), yTC(CSR(q))]);
        }
        pts.push([xTC(qHi), yTC(CSR(qHi))]);
        /* LR line (bottom, reversed) */
        pts.push([xTC(qHi), yTC(CLR(qHi))]);
        pts.push([xTC(qLo), yTC(CLR(qLo))]);
        MT.drawPoly(dynamicTC, pts, { fill: colors.dwl, stroke: colors.dwlStroke, opacity: 0.5 });

        /* Vertical line at Qnew on TC */
        dynamicTC.append('line')
          .attr('x1', xTC(Qn)).attr('y1', yTC(cSR))
          .attr('x2', xTC(Qn)).attr('y2', yTC(cLR))
          .attr('stroke', colors.dwlStroke).attr('stroke-width', 2);
        dynamicTC.append('text')
          .attr('x', xTC(Qn) + 5).attr('y', yTC((cSR + cLR) / 2) + 4)
          .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('+$' + MT.fmt(penalty, 1));

        /* Mark Qnew on TC */
        dynamicTC.append('circle')
          .attr('cx', xTC(Qn)).attr('cy', yTC(cSR))
          .attr('r', 4).attr('fill', colors.supply);
        dynamicTC.append('circle')
          .attr('cx', xTC(Qn)).attr('cy', yTC(cLR))
          .attr('r', 4).attr('fill', colors.demand);

        /* Mark Qnew on MC */
        var mcSR = MCSR(Qn);
        dynamicMC.append('line')
          .attr('x1', xMC(Qn)).attr('y1', yMC(0))
          .attr('x2', xMC(Qn)).attr('y2', yMC(Math.max(mcSR, MCLR)))
          .attr('stroke', colors.equilibrium).attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
        dynamicMC.append('circle')
          .attr('cx', xMC(Qn)).attr('cy', yMC(mcSR))
          .attr('r', 4).attr('fill', colors.supply);
        dynamicMC.append('circle')
          .attr('cx', xMC(Qn)).attr('cy', yMC(MCLR))
          .attr('r', 4).attr('fill', colors.demand);

        /* Info panel */
        var situation = Qn < Q0 ? 'Overcapacity' : 'Undercapacity';
        var mcRel = Qn < Q0 ? 'SR MC < LR MC' : 'SR MC > LR MC';
        d3.select('#info-23').html(
          '<strong>' + situation + ':</strong> Q = ' + MT.fmt(Qn, 1) +
          (Qn < Q0 ? ' < ' : ' > ') + 'Q\u2080 = ' + Q0 +
          '<br><strong>SR Cost:</strong> $' + MT.fmt(cSR, 1) +
          '&ensp;<strong>LR Cost:</strong> $' + MT.fmt(cLR, 1) +
          '&ensp;<strong style="color:' + colors.dwlStroke + '">Penalty:</strong> $' + MT.fmt(penalty, 1) +
          '<br>SR MC = $' + MT.fmt(mcSR, 2) +
          (Qn < Q0 ? ' < ' : ' > ') +
          'LR MC = $' + MT.fmt(MCLR, 2) +
          '<br><em>' + mcRel + ' \u2014 the firm is ' +
          (Qn < Q0 ? 'paying fixed capital costs on underused capacity.' : 'straining to produce beyond its designed scale.') +
          '</em>'
        );
      } else {
        /* At Q0 */
        d3.select('#info-23').html(
          '<strong>At Q\u2080 = ' + Q0 + ':</strong> SR and LR costs are equal.' +
          '<br>K\u2080 = Q\u2080/12 = ' + MT.fmt(K0fn(), 2) +
          '&ensp;C = $' + MT.fmt(CLR(Q0), 1) +
          '<br>SR MC = LR MC = $' + MT.fmt(MCLR, 2) +
          '<br><em>The fixed capital is exactly right for this output level. Move Q to see the cost of inflexibility.</em>'
        );
      }

      /* Math panel */
      var el = document.getElementById('math-23');
      if (el) {
        el.innerHTML =
          '\\(C_{LR}(Q) = \\tfrac{20}{3}Q\\)' +
          '&emsp;' +
          '\\(C_{SR}(Q) = ' + MT.fmt(rK, 0) + '\\cdot' + MT.fmt(K0fn(), 2) +
          ' + \\frac{' + MT.fmt(rL, 0) + '\\,Q^2}{36\\cdot' + MT.fmt(K0fn(), 2) + '}\\)';
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
