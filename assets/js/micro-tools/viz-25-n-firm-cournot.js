/* Viz 25 — N-Firm Cournot: Monopoly → Competition
   N symmetric Cournot firms: P(Q) = A − B*Q, MC=c
   qi* = (A−c)/((N+1)*B)
   Q*  = N*(A−c)/((N+1)*B)
   P*  = (A + N*c)/(N+1)
   πi* = (A−c)²/((N+1)²*B)
   Default: A=100, B=2, c=4 */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var B = 2; /* fixed slope parameter */
    var state = { N: 2, A: 100, c: 4 };

    /* Create the two sub-chart containers inside chart-25 */
    var chartEl = document.getElementById('chart-25');
    var leftDiv = document.createElement('div');
    leftDiv.id = 'chart-25-market';
    leftDiv.className = 'micro-chart';
    leftDiv.style.display = 'inline-block';
    leftDiv.style.width = '50%';
    leftDiv.style.verticalAlign = 'top';
    var rightDiv = document.createElement('div');
    rightDiv.id = 'chart-25-nfirms';
    rightDiv.className = 'micro-chart';
    rightDiv.style.display = 'inline-block';
    rightDiv.style.width = '50%';
    rightDiv.style.verticalAlign = 'top';
    chartEl.appendChild(leftDiv);
    chartEl.appendChild(rightDiv);

    MT.addSlider('controls-25', {
      label: 'Number of firms (N)', min: 1, max: 20, value: state.N, step: 1,
      format: function (v) { return v + (v === 1 ? ' firm' : ' firms'); },
      onChange: function (v) { state.N = v; render(); }
    });


    function computeParams(N, A, c) {
      var qi   = (A - c) / ((N + 1) * B);
      var Qstar = N * qi;
      var Pstar = (A + N * c) / (N + 1);
      var pi_i  = (A - c) * (A - c) / ((N + 1) * (N + 1) * B);
      var Qcomp = (A - c) / B;   /* competitive output (P=MC) */
      var Pmono = (A + c) / 2;   /* monopoly price (N=1) */
      var pi_mono = (A - c) * (A - c) / (4 * B);
      return { qi: qi, Qstar: Qstar, Pstar: Pstar, pi_i: pi_i, Qcomp: Qcomp, Pmono: Pmono, pi_mono: pi_mono };
    }

    function render() {
      var colors = MT.getColors();
      var N = state.N, A = state.A, c = state.c;
      var p = computeParams(N, A, c);

      /* ============================================================
         LEFT PANEL: Market Outcome diagram (P vs Q)
         ============================================================ */
      var Qmax   = (A - c) / B * 1.15;  /* a bit past competitive output */
      var Pmax   = A * 1.05;

      var mkt = MT.createChart('chart-25-market', {
        width: 360, height: 360, margin: { top: 30, right: 25, bottom: 55, left: 60 }
      });
      var xM = d3.scaleLinear().domain([0, Qmax]).range([0, mkt.innerWidth]);
      var yM = d3.scaleLinear().domain([0, Pmax]).range([mkt.innerHeight, 0]);

      MT.drawAxes(mkt, xM, yM, 'Quantity (Q)', 'Price (P)', { xTicks: 5, yTicks: 6 });

      mkt.plotArea.append('text')
        .attr('x', mkt.innerWidth / 2).attr('y', -12)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Market Outcome (N = ' + N + ')');

      /* Demand curve: P = A - B*Q */
      MT.drawCurve(mkt.plotArea,
        function (Q) { return A - B * Q; },
        [0, A / B], xM, yM,
        { color: colors.demand, strokeWidth: 2.5 });
      mkt.plotArea.append('text')
        .attr('x', xM(Qmax * 0.88)).attr('y', yM(A - B * Qmax * 0.88) - 8)
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
        .text('D');

      /* MC horizontal line */
      mkt.plotArea.append('line')
        .attr('x1', xM(0)).attr('y1', yM(c))
        .attr('x2', xM(Qmax)).attr('y2', yM(c))
        .attr('stroke', colors.supply).attr('stroke-width', 2);
      mkt.plotArea.append('text')
        .attr('x', xM(Qmax) - 4).attr('y', yM(c) - 7)
        .attr('text-anchor', 'end')
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold')
        .text('MC = $' + c);

      /* CS region: above P*, below demand, left of Q* */
      if (p.Pstar < A && p.Qstar > 0) {
        var csPoints = [];
        var nCS = 60;
        var csStep = p.Qstar / nCS;
        /* Top: along demand from Q=0 to Q=Q* */
        csPoints.push([xM(0), yM(A)]);
        for (var q = 0; q <= p.Qstar; q += csStep) {
          csPoints.push([xM(q), yM(A - B * q)]);
        }
        csPoints.push([xM(p.Qstar), yM(p.Pstar)]);
        /* Bottom-left corner */
        csPoints.push([xM(0), yM(p.Pstar)]);
        MT.drawPoly(mkt.plotArea, csPoints, { fill: colors.cs, stroke: colors.csStroke, strokeWidth: 1 });
        mkt.plotArea.append('text')
          .attr('x', xM(p.Qstar * 0.22))
          .attr('y', yM((A + p.Pstar) / 2))
          .attr('text-anchor', 'middle')
          .style('fill', colors.csStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('CS');
      }

      /* Total profit rectangle: between MC (c) and P*, width Q* */
      if (p.Pstar > c && p.Qstar > 0) {
        MT.drawPoly(mkt.plotArea, [
          [xM(0),        yM(p.Pstar)],
          [xM(p.Qstar),  yM(p.Pstar)],
          [xM(p.Qstar),  yM(c)],
          [xM(0),        yM(c)]
        ], { fill: colors.ps, stroke: colors.psStroke, strokeWidth: 1 });
        mkt.plotArea.append('text')
          .attr('x', xM(p.Qstar / 2))
          .attr('y', yM((p.Pstar + c) / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('N\u00d7\u03c0');
      }

      /* DWL triangle: from Q* to Qcomp, between demand and MC */
      if (p.Qstar < p.Qcomp) {
        MT.drawPoly(mkt.plotArea, [
          [xM(p.Qstar),  yM(p.Pstar)],
          [xM(p.Qcomp),  yM(c)],
          [xM(p.Qstar),  yM(c)]
        ], { fill: colors.dwl, stroke: colors.dwlStroke, strokeWidth: 1 });
        mkt.plotArea.append('text')
          .attr('x', xM((2 * p.Qstar + p.Qcomp) / 3) + 2)
          .attr('y', yM((p.Pstar + c) / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('DWL');
      }

      /* Equilibrium drop-lines and dot */
      MT.addEqMarker(mkt.plotArea, p.Qstar, p.Pstar, xM, yM, {
        color: colors.equilibrium,
        xLabel: 'Q*=' + MT.fmt(p.Qstar, 1),
        yLabel: 'P*=$' + MT.fmt(p.Pstar, 1),
        r: 5
      });

      /* ============================================================
         RIGHT PANEL: P* vs Number of Firms
         ============================================================ */
      var nChart = MT.createChart('chart-25-nfirms', {
        width: 360, height: 360, margin: { top: 30, right: 30, bottom: 55, left: 60 }
      });
      var xN = d3.scaleLinear().domain([1, 20]).range([0, nChart.innerWidth]);
      var yN = d3.scaleLinear().domain([c * 0.8, A * 1.05]).range([nChart.innerHeight, 0]);

      MT.drawAxes(nChart, xN, yN, 'Number of Firms (N)', 'Price (P*)', { xTicks: 5, yTicks: 6 });

      nChart.plotArea.append('text')
        .attr('x', nChart.innerWidth / 2).attr('y', -12)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Price vs. Number of Firms');

      /* P*(N) curve */
      MT.drawCurve(nChart.plotArea,
        function (n) { return (A + n * c) / (n + 1); },
        [1, 20], xN, yN,
        { color: colors.demand, strokeWidth: 2.5, nPoints: 200 });

      /* Competitive price dashed line */
      nChart.plotArea.append('line')
        .attr('x1', xN(1)).attr('y1', yN(c))
        .attr('x2', xN(20)).attr('y2', yN(c))
        .attr('stroke', colors.positive)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '7,4');
      nChart.plotArea.append('text')
        .attr('x', xN(20) - 4).attr('y', yN(c) - 7)
        .attr('text-anchor', 'end')
        .style('fill', colors.positive).style('font-size', '10px').style('font-weight', 'bold')
        .text('Competitive (P=MC)');

      /* Monopoly price dashed line */
      var Pmono = (A + c) / 2;
      nChart.plotArea.append('line')
        .attr('x1', xN(1)).attr('y1', yN(Pmono))
        .attr('x2', xN(20)).attr('y2', yN(Pmono))
        .attr('stroke', colors.revenue)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '7,4');
      nChart.plotArea.append('text')
        .attr('x', xN(20) - 4).attr('y', yN(Pmono) - 7)
        .attr('text-anchor', 'end')
        .style('fill', colors.revenue).style('font-size', '10px').style('font-weight', 'bold')
        .text('Monopoly');

      /* Highlighted dot at current N */
      nChart.plotArea.append('circle')
        .attr('cx', xN(N))
        .attr('cy', yN(p.Pstar))
        .attr('r', 7)
        .attr('fill', colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2);

      /* Dashed drop-line to competitive and monopoly price */
      nChart.plotArea.append('line')
        .attr('x1', xN(N)).attr('y1', yN(p.Pstar))
        .attr('x2', xN(N)).attr('y2', yN(c))
        .attr('stroke', colors.equilibrium)
        .attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
      nChart.plotArea.append('line')
        .attr('x1', xN(1)).attr('y1', yN(p.Pstar))
        .attr('x2', xN(N)).attr('y2', yN(p.Pstar))
        .attr('stroke', colors.equilibrium)
        .attr('stroke-width', 1).attr('stroke-dasharray', '4,3');

      /* N label on x-axis */
      nChart.plotArea.append('text')
        .attr('x', xN(N)).attr('y', yN(c) + 15)
        .attr('text-anchor', 'middle')
        .style('fill', colors.equilibrium).style('font-size', '10px').style('font-weight', 'bold')
        .text('N=' + N);

      /* ============================================================
         Info panel
         ============================================================ */
      var noteColor;
      var noteText;
      if (N === 1) {
        noteColor = colors.revenue;
        noteText = 'N=1 is the monopolist \u2014 highest price, maximum profit, largest DWL.';
      } else if (N >= 15) {
        noteColor = colors.positive;
        noteText = 'With ' + N + ' firms, price is near marginal cost \u2014 approximating perfect competition.';
      } else {
        noteColor = colors.text;
        noteText = 'As N \u2192 \u221e: P* \u2192 MC = $' + c + ' and each firm\u2019s profit \u2192 0.';
      }

      var pMonoVal = computeParams(1, A, c).Pstar;
      var pctDropFromMono = pMonoVal > c ? ((pMonoVal - p.Pstar) / (pMonoVal - c) * 100) : 0;

      d3.select('#info-25').html(
        '<strong>N = ' + N + ' firm' + (N === 1 ? '' : 's') + ':</strong>' +
        '&ensp;q\u1d62* = ' + MT.fmt(p.qi, 2) +
        '&ensp;|&ensp;Q* = ' + MT.fmt(p.Qstar, 2) +
        '&ensp;|&ensp;P* = $' + MT.fmt(p.Pstar, 2) +
        '&ensp;|&ensp;\u03c0 per firm = $' + MT.fmt(p.pi_i, 1) +
        '<br><strong>vs Monopoly (N=1):</strong> P* is ' +
        MT.fmt(pctDropFromMono, 1) + '% of the way from monopoly ($' + MT.fmt(pMonoVal, 1) + ') to competitive ($' + c + ').' +
        '<br><em style="color:' + noteColor + '">' + noteText + '</em>'
      );

      /* Math panel */
      var el = document.getElementById('math-25');
      if (el) {
        el.innerHTML =
          '\\(q_i^* = \\dfrac{A-c}{(N+1)B},\\quad' +
          'P^* = \\dfrac{A + Nc}{N+1},\\quad' +
          '\\pi_i^* = \\dfrac{(A-c)^2}{(N+1)^2 B}\\)' +
          '<br>' +
          '\\(N=' + N + ':\; P^* = ' + MT.fmt(p.Pstar, 2) +
          ',\; q_i^* = ' + MT.fmt(p.qi, 2) +
          ',\; \\pi_i^* = ' + MT.fmt(p.pi_i, 1) + '\\)';
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
