/* Viz 27 — Bertrand Price War: The Race to the Bottom
   Demand: P = 100 − 8Q  →  Q_D(P) = (100−P)/8
   MC = 4 (fixed)
   Monopoly: MR=MC → 100−16Q=4 → Q_m=6, P_m=52, π_m=288 (one firm)
   Bertrand NE: P=MC=4, Q=12, π=0
   Rules: lower-priced firm captures whole market; tie → split equally. */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var MC      = 4;
    var A       = 100;
    var BSLOPE  = 8;   /* Q = (A − P) / BSLOPE */
    var P_MONO  = 52;
    var state   = { p1: 52, p2: 52 };

    /* ── Controls ────────────────────────────────────────────────── */
    var sliderP1 = MT.addSlider('controls-27', {
      label: 'Firm 1 price (P\u2081)',
      min: 4, max: 52, value: state.p1, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.p1 = v; update(); }
    });

    var sliderP2 = MT.addSlider('controls-27', {
      label: 'Firm 2 price (P\u2082)',
      min: 4, max: 52, value: state.p2, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.p2 = v; update(); }
    });

    MT.addButton('controls-27', {
      label: 'Firm 1 undercuts P\u2082',
      onClick: function () {
        var newP1 = Math.max(MC, state.p2 - 0.5);
        state.p1  = newP1;
        sliderP1.setValue(newP1);
        update();
      }
    });

    MT.addButton('controls-27', {
      label: 'Firm 2 undercuts P\u2081',
      onClick: function () {
        var newP2 = Math.max(MC, state.p1 - 0.5);
        state.p2  = newP2;
        sliderP2.setValue(newP2);
        update();
      }
    });

    MT.addButton('controls-27', {
      label: 'Reset to Monopoly Price',
      onClick: function () {
        state.p1 = P_MONO; state.p2 = P_MONO;
        sliderP1.setValue(P_MONO); sliderP2.setValue(P_MONO);
        update();
      }
    });

    MT.addButton('controls-27', {
      label: 'Both to MC (Bertrand NE)',
      onClick: function () {
        state.p1 = MC; state.p2 = MC;
        sliderP1.setValue(MC); sliderP2.setValue(MC);
        update();
      }
    });

    /* ── Chart state ─────────────────────────────────────────────── */
    var chart, xScale, yScale, dynamicG;
    var Q_MAX = 14;
    var P_MAX = 105;

    function setup() {
      chart  = MT.createChart('chart-27', { height: 440 });
      xScale = d3.scaleLinear().domain([0, Q_MAX]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, P_MAX]).range([chart.innerHeight, 0]);
    }

    /* ── Full render (static elements drawn once) ─────────────────── */
    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale,
        'Quantity (Q)', 'Price ($)',
        { xTicks: 7, yTicks: 7 });

      /* Demand curve: P = 100 − 8Q */
      MT.drawCurve(chart.plotArea,
        function (Q) { return A - BSLOPE * Q; },
        [0, A / BSLOPE], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });
      chart.plotArea.append('text')
        .attr('x', xScale((A / BSLOPE) * 0.9))
        .attr('y', yScale(A * 0.05))
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
        .text('D: P = 100 \u2212 8Q');

      /* MC horizontal line */
      chart.plotArea.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(MC))
        .attr('x2', xScale(Q_MAX * 0.98)).attr('y2', yScale(MC))
        .attr('stroke', colors.supply).attr('stroke-width', 2.2);
      chart.plotArea.append('text')
        .attr('x', xScale(Q_MAX * 0.97)).attr('y', yScale(MC) - 7)
        .attr('text-anchor', 'end')
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold')
        .text('MC = $' + MC);

      /* Monopoly price faint reference line */
      chart.plotArea.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(P_MONO))
        .attr('x2', xScale(Q_MAX * 0.55)).attr('y2', yScale(P_MONO))
        .attr('stroke', colors.grid).attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');
      chart.plotArea.append('text')
        .attr('x', xScale(0) - 6).attr('y', yScale(P_MONO) + 4)
        .attr('text-anchor', 'end')
        .style('fill', colors.textLight).style('font-size', '9px')
        .text('$' + P_MONO + ' (mono)');

      /* Dynamic group (all market-state elements) */
      dynamicG = chart.plotArea.append('g').attr('class', 'dynamic-group');
      update();
    }

    /* ── Market outcome logic ────────────────────────────────────── */
    function marketOutcome() {
      var p1 = state.p1, p2 = state.p2;
      var tied = Math.abs(p1 - p2) < 0.01;
      var Q1, Q2;
      if (tied) {
        /* Split equally */
        Q1 = (A - p1) / (2 * BSLOPE);
        Q2 = Q1;
      } else if (p1 < p2) {
        Q1 = (A - p1) / BSLOPE;
        Q2 = 0;
      } else {
        Q1 = 0;
        Q2 = (A - p2) / BSLOPE;
      }
      return {
        Q1: Q1, Q2: Q2,
        pi1: Q1 * (p1 - MC),
        pi2: Q2 * (p2 - MC),
        tied: tied
      };
    }

    /* ── Dynamic update ──────────────────────────────────────────── */
    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      var colors = MT.getColors();
      var p1 = state.p1, p2 = state.p2;
      var out = marketOutcome();

      /* ---- Firm 1 profit rectangle ---- */
      if (out.Q1 > 0 && p1 > MC) {
        MT.drawPoly(dynamicG, [
          [xScale(0),      yScale(p1)],
          [xScale(out.Q1), yScale(p1)],
          [xScale(out.Q1), yScale(MC)],
          [xScale(0),      yScale(MC)]
        ], { fill: colors.cs, stroke: colors.csStroke, strokeWidth: 1.2, opacity: 0.80 });
        dynamicG.append('text')
          .attr('x', xScale(out.Q1 / 2))
          .attr('y', yScale((p1 + MC) / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.csStroke).style('font-size', '11px').style('font-weight', 'bold')
          .text('\u03c0\u2081 = $' + MT.fmt(out.pi1, 0));
      }

      /* ---- Firm 2 profit rectangle ---- */
      if (out.Q2 > 0 && p2 > MC) {
        /* When tied, firm 1 occupies [0, Q1]; firm 2 occupies [Q1, Q1+Q2].
           When firm 2 wins outright, Q1=0 so firm 2 occupies [0, Q2].        */
        var x2start = out.tied ? out.Q1 : 0;
        MT.drawPoly(dynamicG, [
          [xScale(x2start),           yScale(p2)],
          [xScale(x2start + out.Q2),  yScale(p2)],
          [xScale(x2start + out.Q2),  yScale(MC)],
          [xScale(x2start),           yScale(MC)]
        ], { fill: colors.ps, stroke: colors.psStroke, strokeWidth: 1.2, opacity: 0.80 });
        dynamicG.append('text')
          .attr('x', xScale(x2start + out.Q2 / 2))
          .attr('y', yScale((p2 + MC) / 2) + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.psStroke).style('font-size', '11px').style('font-weight', 'bold')
          .text('\u03c0\u2082 = $' + MT.fmt(out.pi2, 0));
      }

      /* ---- P1 price line ---- */
      if (out.Q1 > 0) {
        dynamicG.append('line')
          .attr('x1', xScale(0)).attr('y1', yScale(p1))
          .attr('x2', xScale(out.Q1)).attr('y2', yScale(p1))
          .attr('stroke', colors.demand).attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '6,3');
        dynamicG.append('text')
          .attr('x', xScale(0) - 6).attr('y', yScale(p1) + 4)
          .attr('text-anchor', 'end')
          .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
          .text('P\u2081=$' + p1.toFixed(1));
      } else {
        /* Firm 1 out of market: faint tick on y-axis */
        dynamicG.append('line')
          .attr('x1', xScale(0)).attr('y1', yScale(p1))
          .attr('x2', xScale(0.5)).attr('y2', yScale(p1))
          .attr('stroke', colors.demand).attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '4,3').attr('opacity', 0.4);
        dynamicG.append('text')
          .attr('x', xScale(0) - 6).attr('y', yScale(p1) + 4)
          .attr('text-anchor', 'end')
          .style('fill', colors.demand).style('font-size', '11px').attr('opacity', 0.4)
          .text('P\u2081=$' + p1.toFixed(1));
      }

      /* ---- P2 price line ---- */
      /* Offset y-label down a bit if P1 and P2 are very close to avoid overlap */
      var p2LabelOffsetY = (!out.tied && Math.abs(p1 - p2) < 3) ? 14 : 4;
      if (out.Q2 > 0) {
        var x2s = out.tied ? out.Q1 : 0;
        dynamicG.append('line')
          .attr('x1', xScale(x2s)).attr('y1', yScale(p2))
          .attr('x2', xScale(x2s + out.Q2)).attr('y2', yScale(p2))
          .attr('stroke', colors.revenue).attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '6,3');
        dynamicG.append('text')
          .attr('x', xScale(0) - 6)
          .attr('y', yScale(p2) + p2LabelOffsetY)
          .attr('text-anchor', 'end')
          .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold')
          .text('P\u2082=$' + p2.toFixed(1));
      } else {
        dynamicG.append('line')
          .attr('x1', xScale(0)).attr('y1', yScale(p2))
          .attr('x2', xScale(0.5)).attr('y2', yScale(p2))
          .attr('stroke', colors.revenue).attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '4,3').attr('opacity', 0.4);
        dynamicG.append('text')
          .attr('x', xScale(0) - 6)
          .attr('y', yScale(p2) + p2LabelOffsetY)
          .attr('text-anchor', 'end')
          .style('fill', colors.revenue).style('font-size', '11px').attr('opacity', 0.4)
          .text('P\u2082=$' + p2.toFixed(1));
      }

      /* ---- Market quantity marker ---- */
      var Qmarket = out.Q1 + out.Q2;
      var Pmarket = out.tied ? p1 : (out.Q1 > 0 ? p1 : p2);
      if (Qmarket > 0.01) {
        dynamicG.append('line')
          .attr('x1', xScale(Qmarket)).attr('y1', yScale(Pmarket))
          .attr('x2', xScale(Qmarket)).attr('y2', yScale(0))
          .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,3');
        dynamicG.append('circle')
          .attr('cx', xScale(Qmarket)).attr('cy', yScale(Pmarket))
          .attr('r', 5).attr('fill', colors.equilibrium)
          .attr('stroke', '#fff').attr('stroke-width', 2);
        dynamicG.append('text')
          .attr('x', xScale(Qmarket) + 6).attr('y', yScale(Pmarket) - 8)
          .style('fill', colors.equilibrium).style('font-size', '10px').style('font-weight', 'bold')
          .text('Q = ' + MT.fmt(Qmarket, 1));
      }

      updateInfoMath(out, colors);
    }

    /* ── Info and Math panels ────────────────────────────────────── */
    function updateInfoMath(out, colors) {
      var p1 = state.p1, p2 = state.p2;
      var isBertrandNE = Math.abs(p1 - MC) < 0.01 && Math.abs(p2 - MC) < 0.01;
      var isMono       = Math.abs(p1 - P_MONO) < 0.01 && Math.abs(p2 - P_MONO) < 0.01;

      var whoWins;
      if (out.tied) {
        whoWins = 'Both firms split the market equally (P\u2081 = P\u2082 = $' + p1.toFixed(1) + ').';
      } else if (out.Q1 > 0) {
        whoWins = 'Firm 1 captures the entire market ' +
                  '(P\u2081 = $' + p1.toFixed(1) + ' < P\u2082 = $' + p2.toFixed(1) + '). Firm 2 sells nothing.';
      } else {
        whoWins = 'Firm 2 captures the entire market ' +
                  '(P\u2082 = $' + p2.toFixed(1) + ' < P\u2081 = $' + p1.toFixed(1) + '). Firm 1 sells nothing.';
      }

      var underNote;
      if (isBertrandNE) {
        underNote = '<em style="color:' + colors.negative + '">Both firms price at MC = $' + MC + '. ' +
                    'Neither can profitably undercut further. This is the Bertrand NE: zero economic profit for both ' +
                    'despite being only two firms.</em>';
      } else if (Math.min(p1, p2) === MC) {
        underNote = '<em>One firm already prices at MC = $' + MC + '. Its rival cannot profitably undercut it. ' +
                    'Matching MC gives both firms zero profit. Until prices match, the lower-priced firm can profitably raise its price while remaining below its rival.</em>';
      } else if (Math.min(p1, p2) === MC + 0.5) {
        underNote = '<em>The buttons use $0.50 steps: undercutting $' + (MC + 0.5).toFixed(1) +
                    ' reaches MC = $' + MC + ' and earns zero profit. A smaller undercut would still profitably capture the whole market in the continuous-price model.</em>';
      } else if (isMono) {
        var undercutPi = (A - (P_MONO - 0.5)) / BSLOPE * (P_MONO - 0.5 - MC);
        underNote = '<em style="color:' + colors.priceLine + '">Both price at the monopoly price ($' + P_MONO + '). ' +
                    'Each earns $' + MT.fmt(out.pi1, 0) + '. But either firm can earn $' +
                    MT.fmt(undercutPi, 0) + ' by undercutting to $' + (P_MONO - 0.5).toFixed(1) +
                    ' and stealing the whole market. This incentive unravels collusion.</em>';
      } else if (out.tied) {
        underNote = '<em>Each firm earns $' + MT.fmt(out.pi1, 0) + '. Either firm can earn more by ' +
                    'undercutting $0.50 to capture the full market. This pressure drives prices down toward MC = $' + MC + '.</em>';
      } else {
        var winner = out.Q1 > 0 ? 1 : 2;
        var loser  = winner === 1 ? 2 : 1;
        var loserPrice = winner === 1 ? p1 : p2;
        underNote = '<em>Firm ' + loser + ' earns $0 and can recover by undercutting to $' +
                    (loserPrice - 0.5).toFixed(1) + '. But then Firm ' + winner +
                    ' undercuts again\u2026 the process continues until P = MC = $' + MC + '.</em>';
      }

      var neNote = isBertrandNE
        ? ' <strong style="color:' + colors.equilibrium + '">\u2605 Bertrand NE reached.</strong>'
        : '';

      d3.select('#info-27').html(
        '<strong>Firm 1:</strong>' +
        ' P\u2081 = $' + p1.toFixed(1) +
        ', Q\u2081 = ' + MT.fmt(out.Q1, 2) +
        ', \u03c0\u2081 = $' + MT.fmt(out.pi1, 1) +
        '<br><strong>Firm 2:</strong>' +
        ' P\u2082 = $' + p2.toFixed(1) +
        ', Q\u2082 = ' + MT.fmt(out.Q2, 2) +
        ', \u03c0\u2082 = $' + MT.fmt(out.pi2, 1) +
        '<br><strong>Market:</strong> ' + whoWins + neNote +
        '<br>' + underNote
      );

      var el = document.getElementById('math-27');
      if (el) {
        el.innerHTML =
          '\\(Q_D(P) = \\dfrac{100 - P}{8},\\quad MC = ' + MC + '\\)' +
          '<br>' +
          '\\(\\pi_1 = Q_1(P_1 - MC) = ' + MT.fmt(out.Q1, 2) +
            ' \\times (\\$' + p1.toFixed(1) + ' - \\$' + MC + ') = \\$' + MT.fmt(out.pi1, 1) + '\\)' +
          '<br>' +
          '\\(\\pi_2 = Q_2(P_2 - MC) = ' + MT.fmt(out.Q2, 2) +
            ' \\times (\\$' + p2.toFixed(1) + ' - \\$' + MC + ') = \\$' + MT.fmt(out.pi2, 1) + '\\)' +
          '<br>' +
          '\\(\\text{Bertrand NE: } P_1^* = P_2^* = MC = \\$' + MC +
            ',\\; Q^* = ' + MT.fmt((A - MC) / BSLOPE, 1) + ',\\; \\pi_1^* = \\pi_2^* = 0\\)';
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
