/* Viz 24 — Cournot Best Response Diagram
   Duopoly: P = A − B(q1+q2), symmetric MC=c
   BR1: q1 = (A−c)/(2B) − q2/2   [firm 1's reaction curve]
   BR2: q2 = (A−c)/(2B) − q1/2   [firm 2's reaction curve]
   Cournot NE: q1=q2=(A−c)/(3B)
   Default: A=100, B=2, c=4 → NE at (16,16), P=36, π=512 */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var B = 2;
    var state = { A: 100, c: 4 };
    var drag1 = { q1: null, q2: null }; /* draggable point */

    MT.addSlider('controls-24', {
      label: 'Demand intercept (A)', min: 20, max: 150, value: state.A, step: 2,
      onChange: function (v) { state.A = v; render(); }
    });

    MT.addSlider('controls-24', {
      label: 'Marginal Cost (MC)', min: 0, max: 40, value: state.c, step: 1,
      format: function (v) { return '$' + v; },
      onChange: function (v) { state.c = v; render(); }
    });

    var chart, xScale, yScale, dynG;

    function params() {
      var A = state.A, c = state.c;
      var half  = (A - c) / (2 * B);
      var qNE   = (A - c) / (3 * B);
      var qMono = half / 2;
      var pNE   = A - B * 2 * qNE;
      var piNE  = (pNE - c) * qNE;
      return { half: half, qNE: qNE, qMono: qMono, pNE: pNE, piNE: piNE };
    }

    function setup() {
      var p = params();
      var axisMax = p.half * 2 * 1.15;
      chart  = MT.createChart('chart-24', { height: 440 });
      xScale = d3.scaleLinear().domain([0, axisMax]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, axisMax]).range([chart.innerHeight, 0]);
    }

    function render() {
      var colors = MT.getColors();
      if (state.A <= state.c) {
        d3.select('#chart-24').selectAll('svg').remove();
        d3.select('#math-24').html('');
        d3.select('#info-24').html('<em style="color:' + colors.negative + '">MC \u2265 A: no profitable output. Both firms produce zero in equilibrium and earn zero profit.</em>');
        return;
      }

      var p = params();
      /* Reset draggable point to cartel position on each full re-render */
      drag1.q1 = p.qMono;
      drag1.q2 = p.qMono;

      setup();
      var axisMax = p.half * 2 * 1.15;

      MT.drawAxes(chart, xScale, yScale,
        'Firm 1 quantity (q\u2081)', 'Firm 2 quantity (q\u2082)',
        { xTicks: 6, yTicks: 6 });

      /* 45° diagonal */
      chart.plotArea.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(0))
        .attr('x2', xScale(axisMax)).attr('y2', yScale(axisMax))
        .attr('stroke', colors.grid).attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,4');
      chart.plotArea.append('text')
        .attr('x', xScale(axisMax * 0.88)).attr('y', yScale(axisMax * 0.88) - 8)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '10px')
        .text('q\u2081 = q\u2082');

      /* BR1: q1 = half − q2/2.  Endpoints: (half,0) and (0, 2·half) */
      chart.plotArea.append('line')
        .attr('x1', xScale(p.half)).attr('y1', yScale(0))
        .attr('x2', xScale(0)).attr('y2', yScale(2 * p.half))
        .attr('stroke', colors.demand).attr('stroke-width', 2.5);
      chart.plotArea.append('text')
        .attr('x', xScale(p.half * 0.08) + 6).attr('y', yScale(p.half * 1.82))
        .attr('text-anchor', 'start')
        .style('fill', colors.demand).style('font-size', '12px').style('font-weight', 'bold')
        .text('BR\u2081 (Firm 1)');

      /* BR2: q2 = half − q1/2.  Endpoints: (0, half) and (2·half, 0) */
      chart.plotArea.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(p.half))
        .attr('x2', xScale(2 * p.half)).attr('y2', yScale(0))
        .attr('stroke', colors.supply).attr('stroke-width', 2.5);
      chart.plotArea.append('text')
        .attr('x', xScale(p.half * 1.72)).attr('y', yScale(p.half * 0.12) - 8)
        .attr('text-anchor', 'middle')
        .style('fill', colors.supply).style('font-size', '12px').style('font-weight', 'bold')
        .text('BR\u2082 (Firm 2)');

      /* Cartel / joint monopoly point */
      chart.plotArea.append('circle')
        .attr('cx', xScale(p.qMono)).attr('cy', yScale(p.qMono))
        .attr('r', 6).attr('fill', colors.revenue)
        .attr('stroke', '#fff').attr('stroke-width', 2);
      chart.plotArea.append('text')
        .attr('x', xScale(p.qMono) + 10).attr('y', yScale(p.qMono) - 8)
        .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold')
        .text('Cartel (' + MT.fmt(p.qMono, 1) + ', ' + MT.fmt(p.qMono, 1) + ')');

      /* Cournot NE point */
      chart.plotArea.append('circle')
        .attr('cx', xScale(p.qNE)).attr('cy', yScale(p.qNE))
        .attr('r', 7).attr('fill', colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2);
      chart.plotArea.append('text')
        .attr('x', xScale(p.qNE) + 10).attr('y', yScale(p.qNE) - 8)
        .style('fill', colors.equilibrium).style('font-size', '11px').style('font-weight', 'bold')
        .text('NE (' + MT.fmt(p.qNE, 1) + ', ' + MT.fmt(p.qNE, 1) + ')');

      /* Axis intercept labels */
      chart.plotArea.append('text')
        .attr('x', xScale(p.half)).attr('y', yScale(0) + 16)
        .attr('text-anchor', 'middle').style('fill', colors.demand).style('font-size', '10px')
        .text(MT.fmt(p.half, 1));
      chart.plotArea.append('text')
        .attr('x', xScale(0) - 6).attr('y', yScale(2 * p.half) + 4)
        .attr('text-anchor', 'end').style('fill', colors.demand).style('font-size', '10px')
        .text(MT.fmt(2 * p.half, 1));
      chart.plotArea.append('text')
        .attr('x', xScale(0) - 6).attr('y', yScale(p.half) + 4)
        .attr('text-anchor', 'end').style('fill', colors.supply).style('font-size', '10px')
        .text(MT.fmt(p.half, 1));
      chart.plotArea.append('text')
        .attr('x', xScale(2 * p.half)).attr('y', yScale(0) + 16)
        .attr('text-anchor', 'middle').style('fill', colors.supply).style('font-size', '10px')
        .text(MT.fmt(2 * p.half, 1));

      /* Dynamic layer (draggable point + incentive arrows) */
      dynG = chart.plotArea.append('g').attr('class', 'dyn24');
      drawDynamic(p, colors);
    }

    /* ---- Arrow helper: draws line + arrowhead polygon ---- */
    function drawArrow(g, x1, y1, x2, y2, color) {
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 18) { return; }
      var ux = dx / len, uy = dy / len;
      var sx = x1 + ux * 14;   /* start clear of the draggable dot */
      var sy = y1 + uy * 14;
      var headLen = 10;
      var ang = Math.PI / 6;
      var theta = Math.atan2(dy, dx);

      g.append('line')
        .attr('x1', sx).attr('y1', sy)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', color).attr('stroke-width', 2.2).attr('opacity', 0.82);
      g.append('polygon')
        .attr('points',
          x2 + ',' + y2 + ' ' +
          (x2 - headLen * Math.cos(theta - ang)) + ',' + (y2 - headLen * Math.sin(theta - ang)) + ' ' +
          (x2 - headLen * Math.cos(theta + ang)) + ',' + (y2 - headLen * Math.sin(theta + ang)))
        .attr('fill', color).attr('opacity', 0.82);
    }

    /* ---- Main dynamic draw: arrows + draggable dot + info ---- */
    function drawDynamic(p, colors) {
      dynG.selectAll('*').remove();

      var q1   = drag1.q1, q2 = drag1.q2;
      var A    = state.A,  c  = state.c;
      var half = p.half;
      var axisMax = half * 2 * 1.15;

      /* Current market outcome */
      var P   = A - B * (q1 + q2);
      var pi1 = q1 * (P - c);
      var pi2 = q2 * (P - c);

      /* Best responses */
      var br1 = Math.max(0, half - q2 / 2);  /* Firm 1's BR given current q2 */
      var br2 = Math.max(0, half - q1 / 2);  /* Firm 2's BR given current q1 */

      var tol  = 0.5;
      var f1ok = Math.abs(q1 - br1) < tol;
      var f2ok = Math.abs(q2 - br2) < tol;
      var atNE = f1ok && f2ok;

      /* Incentive arrows (horizontal for firm 1, vertical for firm 2) */
      if (!f1ok) {
        drawArrow(dynG,
          xScale(q1), yScale(q2),
          xScale(br1), yScale(q2),
          colors.demand);
      }
      if (!f2ok) {
        drawArrow(dynG,
          xScale(q1), yScale(q2),
          xScale(q1), yScale(br2),
          colors.supply);
      }

      /* Draggable dot */
      var dotCol = atNE ? colors.equilibrium : colors.priceLine;
      var dot = dynG.append('circle')
        .attr('cx', xScale(q1)).attr('cy', yScale(q2))
        .attr('r', 11).attr('fill', dotCol)
        .attr('stroke', '#fff').attr('stroke-width', 2.5)
        .attr('cursor', 'grab');

      dot.call(d3.drag()
        .on('start', function () { dot.attr('cursor', 'grabbing'); })
        .on('drag', function (event) {
          var coords = d3.pointer(event, chart.plotArea.node());
          drag1.q1 = Math.max(0, Math.min(axisMax, xScale.invert(coords[0])));
          drag1.q2 = Math.max(0, Math.min(axisMax, yScale.invert(coords[1])));
          drawDynamic(p, colors);
        })
        .on('end', function () { dot.attr('cursor', 'grab'); })
      );

      /* "drag me" hint shown only at starting position */
      var isStart = Math.abs(q1 - p.qMono) < 0.5 && Math.abs(q2 - p.qMono) < 0.5;
      if (isStart) {
        dynG.append('text')
          .attr('x', xScale(q1) + 15).attr('y', yScale(q2) + 4)
          .style('fill', colors.textLight).style('font-size', '10px').style('font-style', 'italic')
          .text('drag me');
      }

      /* ---- Info panel ---- */
      var piIfBR1 = br1 * (A - B * (br1 + q2) - c);
      var piIfBR2 = br2 * (A - B * (q1 + br2) - c);

      var f1msg, f2msg;
      if (f1ok) {
        f1msg = '<span style="color:' + colors.positive + '">\u2714 Firm 1 is at its best response to q\u2082 = ' +
                MT.fmt(q2, 1) + ' \u2014 no incentive to change q\u2081.</span>';
      } else {
        f1msg = '<span style="color:' + colors.demand + '">\u2192 Firm 1 wants to ' +
                (br1 > q1 ? 'increase' : 'decrease') + ' q\u2081: ' +
                MT.fmt(q1, 1) + ' \u2192 ' + MT.fmt(br1, 1) +
                ' (best response to q\u2082 = ' + MT.fmt(q2, 1) + '). ' +
                'Profit: $' + MT.fmt(pi1, 1) + ' \u2192 $' + MT.fmt(piIfBR1, 1) + '.</span>';
      }
      if (f2ok) {
        f2msg = '<span style="color:' + colors.positive + '">\u2714 Firm 2 is at its best response to q\u2081 = ' +
                MT.fmt(q1, 1) + ' \u2014 no incentive to change q\u2082.</span>';
      } else {
        f2msg = '<span style="color:' + colors.supply + '">\u2192 Firm 2 wants to ' +
                (br2 > q2 ? 'increase' : 'decrease') + ' q\u2082: ' +
                MT.fmt(q2, 1) + ' \u2192 ' + MT.fmt(br2, 1) +
                ' (best response to q\u2081 = ' + MT.fmt(q1, 1) + '). ' +
                'Profit: $' + MT.fmt(pi2, 1) + ' \u2192 $' + MT.fmt(piIfBR2, 1) + '.</span>';
      }

      var neNote = atNE
        ? '<br><strong style="color:' + colors.equilibrium + '">\u2605 Nash Equilibrium: both firms are at their best responses simultaneously \u2014 no profitable deviation exists.</strong>'
        : '';

      d3.select('#info-24').html(
        '<strong>Current outcome:</strong>' +
        ' q\u2081 = ' + MT.fmt(q1, 1) +
        ', q\u2082 = ' + MT.fmt(q2, 1) +
        ', Q = ' + MT.fmt(q1 + q2, 1) +
        ', P = $' + MT.fmt(P, 1) +
        ' &ensp;|\u2009 \u03c0\u2081 = $' + MT.fmt(pi1, 1) +
        ' &ensp;|\u2009 \u03c0\u2082 = $' + MT.fmt(pi2, 1) +
        '<br>' + f1msg +
        '<br>' + f2msg +
        neNote
      );

      var el = document.getElementById('math-24');
      if (el) {
        el.innerHTML =
          '\\(BR_1:\\; q_1^* = ' + MT.fmt(half, 1) + ' - \\tfrac{q_2}{2}\\)' +
          '\\qquad' +
          '\\(BR_2:\\; q_2^* = ' + MT.fmt(half, 1) + ' - \\tfrac{q_1}{2}\\)' +
          '<br>' +
          '\\(\\text{NE: }q_1^* = q_2^* = \\tfrac{A-c}{3B} = ' + MT.fmt(p.qNE, 1) +
          ',\\quad P^* = \\$' + MT.fmt(p.pNE, 1) +
          ',\\quad \\pi^* = \\$' + MT.fmt(p.piNE, 1) + '\\)';
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
