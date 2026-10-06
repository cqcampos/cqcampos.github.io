/* Viz 29 — Comparing Market Structures
   P = A − B*Q,  MC = c.  Default: A=100, B=2, c=4.
   Competitive:  P=c,  Q=(A−c)/B=48
   Cournot (N=2): Q=2(A−c)/(3B)=32, P=(A+2c)/3=36
   Stackelberg:  Q=3(A−c)/(4B)=36, P=(A+3c)/4=28
     Leader q1=(A−c)/(2B)=24, Follower q2=(A−c)/(4B)=12
   Monopoly:     Q=(A−c)/(2B)=24, P=(A+c)/2=52            */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { structure: 'cournot', A: 100, c: 4 };
    var B = 2;

    MT.addDropdown('controls-29', {
      label: 'Market Structure',
      value: state.structure,
      options: [
        { value: 'competitive',  label: 'Competitive (P = MC)' },
        { value: 'cournot',      label: 'Cournot Duopoly (2 firms)' },
        { value: 'stackelberg',  label: 'Stackelberg (Leader + Follower)' },
        { value: 'monopoly',     label: 'Monopoly / Cartel' }
      ],
      onChange: function (v) { state.structure = v; render(); }
    });

    MT.addSlider('controls-29', {
      label: 'Demand intercept (A)',
      min: 20, max: 150, value: state.A, step: 2,
      onChange: function (v) { state.A = v; render(); }
    });

    MT.addSlider('controls-29', {
      label: 'Marginal Cost (MC)',
      min: 0, max: 40, value: state.c, step: 1,
      format: function (v) { return '$' + v; },
      onChange: function (v) { state.c = v; render(); }
    });

    function computeAll(A, c) {
      var spread = A - c;
      var Q_comp  = spread / B;

      var Q_cour  = 2 * spread / (3 * B);
      var P_cour  = (A + 2 * c) / 3;
      var pi_each_cour = (Q_cour / 2) * (P_cour - c);
      var pi_cour = 2 * pi_each_cour;
      var CS_cour = 0.5 * (A - P_cour) * Q_cour;
      var DWL_cour = 0.5 * (P_cour - c) * (Q_comp - Q_cour);

      var q1_s = spread / (2 * B);
      var q2_s = spread / (4 * B);
      var Q_s  = q1_s + q2_s;
      var P_s  = A - B * Q_s;
      var pi1_s = q1_s * (P_s - c);
      var pi2_s = q2_s * (P_s - c);
      var CS_s  = 0.5 * (A - P_s) * Q_s;
      var DWL_s = 0.5 * (P_s - c) * (Q_comp - Q_s);

      var Q_m  = spread / (2 * B);
      var P_m  = (A + c) / 2;
      var pi_m = Q_m * (P_m - c);
      var CS_m = 0.5 * (A - P_m) * Q_m;
      var DWL_m = 0.5 * (P_m - c) * (Q_comp - Q_m);

      return {
        competitive:  { Q: Q_comp, P: c,   CS: 0.5 * spread * Q_comp, profit: 0,       DWL: 0,       label: 'Competitive' },
        cournot:      { Q: Q_cour, P: P_cour, CS: CS_cour, profit: pi_cour, DWL: DWL_cour, label: 'Cournot Duopoly', pi_each: pi_each_cour },
        stackelberg:  { Q: Q_s, P: P_s, CS: CS_s, profit: pi1_s + pi2_s, DWL: DWL_s, label: 'Stackelberg', q1: q1_s, q2: q2_s, pi1: pi1_s, pi2: pi2_s },
        monopoly:     { Q: Q_m, P: P_m, CS: CS_m, profit: pi_m, DWL: DWL_m, label: 'Monopoly' },
        comp_Q: Q_comp,
        mono_P: P_m, cour_P: P_cour, stack_P: P_s, comp_P: c
      };
    }

    function render() {
      var colors = MT.getColors();
      var A = state.A, c = state.c, s = state.structure;
      var all = computeAll(A, c);
      var m   = all[s];

      if (A <= c) {
        d3.select('#chart-29').selectAll('svg').remove();
        d3.select('#math-29').html('');
        d3.select('#info-29').html('<em style="color:' + colors.negative + '">MC \u2265 A: no profitable output.</em>');
        return;
      }

      var xMax = all.comp_Q * 1.12;
      var yMax = A * 1.08;

      var chart = MT.createChart('chart-29', {
        width: 680, height: 430,
        margin: { top: 44, right: 44, bottom: 60, left: 74 }
      });

      var xScale = d3.scaleLinear().domain([0, xMax]).range([0, chart.innerWidth]);
      var yScale = d3.scaleLinear().domain([0, yMax]).range([chart.innerHeight, 0]);

      MT.drawAxes(chart, xScale, yScale, 'Quantity (Q)', 'Price (P)', { xTicks: 6, yTicks: 7 });

      chart.svg.append('text')
        .attr('x', chart.margin.left + chart.innerWidth / 2).attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text(m.label + ': Market Outcome');

      /* Demand curve */
      MT.drawCurve(chart.plotArea,
        function (q) { return A - B * q; },
        [0, A / B], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });
      chart.plotArea.append('text')
        .attr('x', xScale(xMax * 0.88)).attr('y', yScale(A - B * xMax * 0.88) - 8)
        .attr('text-anchor', 'end')
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
        .text('D');

      /* MC line */
      chart.plotArea.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(c))
        .attr('x2', xScale(xMax)).attr('y2', yScale(c))
        .attr('stroke', colors.supply).attr('stroke-width', 2);
      chart.plotArea.append('text')
        .attr('x', xScale(xMax) - 4).attr('y', yScale(c) - 7)
        .attr('text-anchor', 'end')
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold')
        .text('MC = $' + c);

      /* MR curve for monopoly */
      if (s === 'monopoly') {
        var qMR0 = A / (2 * B);
        MT.drawCurve(chart.plotArea,
          function (q) { return A - 2 * B * q; },
          [0, qMR0], xScale, yScale,
          { color: colors.revenue, strokeWidth: 2, dashed: true, nPoints: 100 });
        chart.plotArea.append('text')
          .attr('x', xScale(qMR0 * 0.90)).attr('y', yScale(A - 2 * B * qMR0 * 0.90) - 8)
          .attr('text-anchor', 'end')
          .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold')
          .text('MR');
      }

      var Q = m.Q, P = m.P;

      /* CS region */
      if (Q > 0 && P < A) {
        var csPts = [];
        var nCS = 60;
        var csStep = Q / nCS;
        csPts.push([xScale(0), yScale(A)]);
        for (var i = 0; i <= nCS; i++) {
          csPts.push([xScale(i * csStep), yScale(A - B * i * csStep)]);
        }
        csPts.push([xScale(Q), yScale(P)]);
        csPts.push([xScale(0), yScale(P)]);
        MT.drawPoly(chart.plotArea, csPts, { fill: colors.cs, stroke: colors.csStroke, strokeWidth: 1 });
        chart.plotArea.append('text')
          .attr('x', xScale(Q * 0.20)).attr('y', yScale((A + P) / 2))
          .attr('text-anchor', 'middle')
          .style('fill', colors.csStroke).style('font-size', '11px').style('font-weight', 'bold')
          .text('CS');
      }

      /* Profit rectangle(s) */
      if (P > c && Q > 0) {
        if (s === 'stackelberg') {
          var q1s = all.stackelberg.q1;
          var q2s = all.stackelberg.q2;
          MT.drawPoly(chart.plotArea, [
            [xScale(0),   yScale(P)], [xScale(q1s), yScale(P)],
            [xScale(q1s), yScale(c)], [xScale(0),   yScale(c)]
          ], { fill: colors.ps, stroke: colors.psStroke, strokeWidth: 1 });
          chart.plotArea.append('text')
            .attr('x', xScale(q1s / 2)).attr('y', yScale((P + c) / 2) + 4)
            .attr('text-anchor', 'middle')
            .style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold')
            .text('\u03c0\u2081');
          MT.drawPoly(chart.plotArea, [
            [xScale(q1s),       yScale(P)], [xScale(q1s + q2s), yScale(P)],
            [xScale(q1s + q2s), yScale(c)], [xScale(q1s),       yScale(c)]
          ], { fill: colors.socialFaded, stroke: colors.psStroke, strokeWidth: 1, opacity: 0.85 });
          chart.plotArea.append('text')
            .attr('x', xScale(q1s + q2s / 2)).attr('y', yScale((P + c) / 2) + 4)
            .attr('text-anchor', 'middle')
            .style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold')
            .text('\u03c0\u2082');
        } else if (s !== 'competitive') {
          MT.drawPoly(chart.plotArea, [
            [xScale(0), yScale(P)], [xScale(Q), yScale(P)],
            [xScale(Q), yScale(c)], [xScale(0), yScale(c)]
          ], { fill: colors.ps, stroke: colors.psStroke, strokeWidth: 1 });
          chart.plotArea.append('text')
            .attr('x', xScale(Q / 2)).attr('y', yScale((P + c) / 2) + 4)
            .attr('text-anchor', 'middle')
            .style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold')
            .text(s === 'cournot' ? 'Total \u03c0' : '\u03c0');
        }
      }

      /* DWL triangle */
      if (m.DWL > 0 && Q < all.comp_Q) {
        MT.drawPoly(chart.plotArea, [
          [xScale(Q),          yScale(P)],
          [xScale(all.comp_Q), yScale(c)],
          [xScale(Q),          yScale(c)]
        ], { fill: colors.dwl, stroke: colors.dwlStroke, strokeWidth: 1 });
        chart.plotArea.append('text')
          .attr('x', xScale((2 * Q + all.comp_Q) / 3) + 2).attr('y', yScale((P + c) / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('DWL');
      }

      MT.addEqMarker(chart.plotArea, Q, P, xScale, yScale, {
        color: colors.equilibrium,
        xLabel: 'Q*=' + MT.fmt(Q, 1),
        yLabel: 'P*=$' + MT.fmt(P, 1),
        r: 5
      });

      /* Info panel */
      var infoExtra = '';
      if (s === 'stackelberg') {
        infoExtra =
          '<br><strong>Leader (q\u2081=' + MT.fmt(all.stackelberg.q1, 1) + '):</strong> \u03c0\u2081 = $' + MT.fmt(all.stackelberg.pi1, 1) +
          ' &ensp;|&ensp; <strong>Follower (q\u2082=' + MT.fmt(all.stackelberg.q2, 1) + '):</strong> \u03c0\u2082 = $' + MT.fmt(all.stackelberg.pi2, 1);
      } else if (s === 'cournot') {
        infoExtra =
          '<br><strong>Each firm produces:</strong> q* = ' + MT.fmt(Q / 2, 1) +
          ' &ensp;|&ensp; <strong>\u03c0 per firm:</strong> $' + MT.fmt(all.cournot.pi_each, 1);
      } else if (s === 'competitive') {
        infoExtra = '<br><em>Perfect competition: P = MC, no profit, no DWL. All surplus goes to consumers.</em>';
      }

      d3.select('#info-29').html(
        '<strong>' + m.label + ':</strong>' +
        ' Q* = ' + MT.fmt(Q, 1) +
        ' &ensp;|&ensp; P* = $' + MT.fmt(P, 1) +
        ' &ensp;|&ensp; CS = $' + MT.fmt(m.CS, 1) +
        ' &ensp;|&ensp; Total Profit = $' + MT.fmt(m.profit, 1) +
        ' &ensp;|&ensp; DWL = $' + MT.fmt(m.DWL, 1) +
        infoExtra +
        '<br><strong>Price comparison:</strong> ' +
        'Monopoly P=$' + MT.fmt(all.mono_P, 1) +
        ' | Stackelberg P=$' + MT.fmt(all.stack_P, 1) +
        ' | Cournot P=$' + MT.fmt(all.cour_P, 1) +
        ' | Competitive P=$' + MT.fmt(all.comp_P, 1)
      );

      /* Math panel */
      var el = document.getElementById('math-29');
      if (el) {
        var mathStr = '';
        if (s === 'competitive') {
          mathStr =
            '\\(P = MC = c \\implies Q^{\\text{comp}} = \\frac{A-c}{B} = ' + MT.fmt(Q, 1) + '\\)' +
            '<br>\\(CS = \\tfrac{1}{2}(A-c)Q = ' + MT.fmt(m.CS, 1) + ',\\quad \\pi = 0,\\quad DWL = 0\\)';
        } else if (s === 'cournot') {
          mathStr =
            '\\(MR_i = MC \\implies q_i^* = \\frac{A-c}{3B},\\quad Q^* = \\frac{2(A-c)}{3B} = ' + MT.fmt(Q, 1) + ',\\quad P^* = \\frac{A+2c}{3} = ' + MT.fmt(P, 1) + '\\)' +
            '<br>\\(\\pi_{\\text{each}} = \\frac{(A-c)^2}{9B} = ' + MT.fmt(all.cournot.pi_each, 1) + ',\\quad DWL = ' + MT.fmt(m.DWL, 1) + '\\)';
        } else if (s === 'stackelberg') {
          mathStr =
            '\\(\\text{Leader: } q_1^* = \\frac{A-c}{2B} = ' + MT.fmt(all.stackelberg.q1, 1) + '\\)' +
            '<br>\\(\\text{Follower BR: } q_2^* = \\frac{A-c}{4B} = ' + MT.fmt(all.stackelberg.q2, 1) + ',\\quad Q^* = ' + MT.fmt(Q, 1) + ',\\quad P^* = \\frac{A+3c}{4} = ' + MT.fmt(P, 1) + '\\)' +
            '<br>\\(\\pi_1 = ' + MT.fmt(all.stackelberg.pi1, 1) + ',\\quad \\pi_2 = ' + MT.fmt(all.stackelberg.pi2, 1) + ',\\quad DWL = ' + MT.fmt(m.DWL, 1) + '\\)';
        } else if (s === 'monopoly') {
          mathStr =
            '\\(MR = MC \\implies A - 2BQ = c \\implies Q^m = \\frac{A-c}{2B} = ' + MT.fmt(Q, 1) + '\\)' +
            '<br>\\(P^m = \\frac{A+c}{2} = ' + MT.fmt(P, 1) + ',\\quad \\pi = (P^m - c)Q^m = ' + MT.fmt(m.profit, 1) + ',\\quad DWL = ' + MT.fmt(m.DWL, 1) + '\\)';
        }
        el.innerHTML = mathStr;
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
