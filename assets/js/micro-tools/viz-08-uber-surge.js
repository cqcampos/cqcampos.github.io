/* Viz 8 — Uber Surge Pricing: Price Ceilings and Wait Times
   Start at equilibrium. Demand surges right (NYE, concert, rainstorm).
   With surge pricing the market clears at a new, higher P**.
   Without surge the price is stuck at old P* — a price ceiling.
   Shortage = Q_D'(P*) − Q_S(P*). That shortage becomes wait time.

   Model:
     Q_D = 80 − 2P   (original demand)
     Q_S = 2P − 20    (supply — drivers willing to drive)
     Equilibrium: P*=25, Q*=30

   Demand shift adds Δ to the intercept:
     Q_D' = (80+Δ) − 2P
     New eq: P** = (80+Δ+20)/4 = (100+Δ)/4, Q** = 2P**−20

   Ceiling at P*=25:
     Q_S(25) = 30, Q_D'(25) = (80+Δ)−50 = 30+Δ
     Shortage = Δ
     Wait time ∝ (shortage/Q_S)^2  (convex — congestion effect)          */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var dA = 80, dB = -2;
    var sA = -20, sB = 2;
    var eq0 = MT.solveLinearEq(dA, dB, sA, sB); // P=25, Q=30
    var P0 = eq0.P, Q0 = eq0.Q;

    var WAIT_K = 12;         // minutes per unit of (shortage/Qs)^2
    var MAX_WAIT = 60;       // cap display at 60 min

    var state = { shift: 20, surge: false };
    var sliders = {};

    sliders.shift = MT.addSlider('controls-08', {
      label: 'Demand surge (\u0394)', min: 0, max: 60, value: 20, step: 1,
      format: function (v) { return '+' + v; },
      onChange: function (v) { state.shift = v; update(); }
    });

    MT.addToggle('controls-08', {
      label: 'Surge pricing ON',
      checked: false,
      onChange: function (v) { state.surge = v; update(); }
    });

    /* Wait-time mini-chart container */
    var waitDiv = document.createElement('div');
    waitDiv.id = 'chart-08-wait';
    waitDiv.className = 'micro-chart';
    document.getElementById('chart-08').parentNode.appendChild(waitDiv);

    var chart, xScale, yScale, dynamicG;
    var waitChart, waitX, waitY;

    function setup() {
      chart  = MT.createChart('chart-08', { height: 340 });
      xScale = d3.scaleLinear().domain([0, 80]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 55]).range([chart.innerHeight, 0]);

      waitChart = MT.createChart('chart-08-wait', {
        height: 150, margin: { top: 15, right: 40, bottom: 48, left: 65 }
      });
      waitX = d3.scaleLinear().domain([0, 15]).range([0, waitChart.innerWidth]);
      waitY = d3.scaleLinear().domain([0, MAX_WAIT]).range([waitChart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale, 'Rides (Q)', 'Price ($)');

      /* Supply — always the same */
      var sMaxQ = sA + sB * yScale.domain()[1];
      MT.drawCurve(chart.plotArea,
        function (q) { return (q - sA) / sB; },
        [Math.max(0, sA), Math.min(sMaxQ, xScale.domain()[1])], xScale, yScale,
        { color: colors.supply, strokeWidth: 2.5 });

      /* Original demand (faded) */
      MT.drawCurve(chart.plotArea,
        function (q) { return (dA - q) / (-dB); },
        [0, dA], xScale, yScale,
        { color: colors.demandFaded, strokeWidth: 2, dashed: true });

      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(dA - 2, 76))).attr('y', yScale(0.8))
        .style('fill', colors.demandFaded).style('font-size', '11px')
        .style('font-weight', 'bold').text('D\u2080');
      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(sMaxQ - 2, 76))).attr('y', yScale(yScale.domain()[1] - 1))
        .style('fill', colors.supply).style('font-size', '11px')
        .style('font-weight', 'bold').text('S');

      /* Wait-time mini-chart: curve */
      MT.drawAxes(waitChart, waitX, waitY, 'Price gap (P**\u2212P*)', 'Est. extra wait (min)', { xTicks: 6, yTicks: 4 });
      MT.drawCurve(waitChart.plotArea,
        function (gap) {
          var ratio = (sB - dB) * gap / Q0;
          return Math.min(MAX_WAIT, WAIT_K * ratio * ratio);
        },
        [0, 15], waitX, waitY,
        { color: colors.dwlStroke, strokeWidth: 2 });

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();

      /* Update wait-time dot */
      var newDA = dA + state.shift;
      var eq1 = MT.solveLinearEq(newDA, dB, sA, sB);
      var gap = state.surge ? 0 : Math.max(0, eq1.P - P0);
      var ratio = (sB - dB) * gap / Q0;
      var waitVal = Math.min(MAX_WAIT, WAIT_K * ratio * ratio);

      waitChart.plotArea.selectAll('.wait-dot').remove();
      waitChart.plotArea.append('circle').attr('class', 'wait-dot')
        .attr('cx', waitX(gap)).attr('cy', waitY(waitVal))
        .attr('r', 5).attr('fill', MT.getColors().dwlStroke);

      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var shift = state.shift;
      var newDA = dA + shift;
      var pChoke = newDA / (-dB);   // price intercept of shifted demand

      /* Shifted demand */
      MT.drawCurve(dynamicG,
        function (q) { return (newDA - q) / (-dB); },
        [0, Math.min(newDA, xScale.domain()[1])], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      dynamicG.append('text')
        .attr('x', xScale(Math.min(newDA - 2, 76))).attr('y', yScale(0.8))
        .style('fill', colors.demand).style('font-size', '11px')
        .style('font-weight', 'bold').text("D'");

      /* Original eq dot */
      dynamicG.append('circle')
        .attr('cx', xScale(Q0)).attr('cy', yScale(P0))
        .attr('r', 4).attr('fill', colors.textLight);

      var eq1 = MT.solveLinearEq(newDA, dB, sA, sB);

      if (state.surge) {
        /* ---- SURGE ON: market clears at new equilibrium ---- */
        if (eq1.P > 0 && eq1.Q > 0) {
          MT.addEqMarker(dynamicG, eq1.Q, eq1.P, xScale, yScale, {
            xLabel: "Q**=" + MT.fmt(eq1.Q, 1),
            yLabel: "P**=$" + MT.fmt(eq1.P, 1),
            color: colors.equilibrium
          });
        }

        d3.select('#info-08').html(
          '<strong>Surge pricing ON</strong> \u2014 market clears' +
          '<br><strong>New eq:</strong> P**=$' + MT.fmt(eq1.P, 1) +
          ', Q**=' + MT.fmt(eq1.Q, 1) +
          '<br><strong>Wait time:</strong> ~0 min' +
          '<br>No shortage \u2014 price does the rationing.'
        );

        MT.updateMath('math-08',
          'P^{**}=' + MT.fmt(eq1.P, 1) +
          ',\\;Q^{**}=' + MT.fmt(eq1.Q, 1) +
          ',\\;\\text{Shortage}=0,\\;\\text{Wait}\\approx 0');

      } else {
        /* ---- SURGE OFF: price ceiling at P0 ---- */
        var QsAtCeil = Math.max(0, sA + sB * P0);   // = Q0
        var QdAtCeil = Math.max(0, newDA + dB * P0);
        var shortage = Math.max(0, QdAtCeil - QsAtCeil);

        /* Ceiling line */
        dynamicG.append('line')
          .attr('x1', xScale(0)).attr('x2', xScale(xScale.domain()[1]))
          .attr('y1', yScale(P0)).attr('y2', yScale(P0))
          .attr('stroke', colors.taxStroke).attr('stroke-width', 2)
          .attr('stroke-dasharray', '6,4');
        dynamicG.append('text')
          .attr('x', xScale(xScale.domain()[1]) - 4).attr('y', yScale(P0) - 6)
          .attr('text-anchor', 'end')
          .style('fill', colors.taxStroke).style('font-size', '9px').style('font-weight', 'bold')
          .text('Price right before the surge = $' + MT.fmt(P0, 0));

        if (shortage > 0) {
          /* Shortage bracket */
          var bracketY = yScale(P0) + 18;
          dynamicG.append('line')
            .attr('x1', xScale(QsAtCeil)).attr('x2', xScale(QdAtCeil))
            .attr('y1', bracketY).attr('y2', bracketY)
            .attr('stroke', colors.dwlStroke).attr('stroke-width', 2);
          /* bracket ticks */
          dynamicG.append('line')
            .attr('x1', xScale(QsAtCeil)).attr('x2', xScale(QsAtCeil))
            .attr('y1', bracketY - 4).attr('y2', bracketY + 4)
            .attr('stroke', colors.dwlStroke).attr('stroke-width', 2);
          dynamicG.append('line')
            .attr('x1', xScale(QdAtCeil)).attr('x2', xScale(QdAtCeil))
            .attr('y1', bracketY - 4).attr('y2', bracketY + 4)
            .attr('stroke', colors.dwlStroke).attr('stroke-width', 2);
          dynamicG.append('text')
            .attr('x', xScale((QsAtCeil + QdAtCeil) / 2)).attr('y', bracketY + 16)
            .attr('text-anchor', 'middle')
            .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold')
            .text('Shortage = ' + MT.fmt(shortage, 0));

          /* Vertical dotted lines from ceiling to axis for Qs and Qd */
          dynamicG.append('line')
            .attr('x1', xScale(QsAtCeil)).attr('x2', xScale(QsAtCeil))
            .attr('y1', yScale(P0)).attr('y2', yScale(0))
            .attr('stroke', colors.supply).attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
          dynamicG.append('line')
            .attr('x1', xScale(QdAtCeil)).attr('x2', xScale(QdAtCeil))
            .attr('y1', yScale(P0)).attr('y2', yScale(0))
            .attr('stroke', colors.demand).attr('stroke-dasharray', '3,3').attr('stroke-width', 1);

          /* Q_S and Q_D labels on axis */
          dynamicG.append('text')
            .attr('x', xScale(QsAtCeil)).attr('y', yScale(0) + 14)
            .attr('text-anchor', 'middle')
            .style('fill', colors.supply).style('font-size', '10px').style('font-weight', 'bold')
            .text('Q\u209B=' + MT.fmt(QsAtCeil, 0));
          dynamicG.append('text')
            .attr('x', xScale(QdAtCeil)).attr('y', yScale(0) + 14)
            .attr('text-anchor', 'middle')
            .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
            .text('Q\u1D30=' + MT.fmt(QdAtCeil, 0));

          /* DWL triangle: between D' and S from Q_traded to Q_efficient */
          var PdAtCeil = (newDA - QsAtCeil) / (-dB);  // demand price at ceiling qty
          MT.drawPoly(dynamicG, [
            [xScale(QsAtCeil), yScale(PdAtCeil)],
            [xScale(eq1.Q), yScale(eq1.P)],
            [xScale(QsAtCeil), yScale(P0)]
          ], { fill: colors.dwl, stroke: colors.dwlStroke });

          dynamicG.append('text')
            .attr('x', xScale((QsAtCeil + eq1.Q) / 2) - 4).attr('y', yScale((PdAtCeil + P0) / 2) + 4)
            .attr('text-anchor', 'middle')
            .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold')
            .text('DWL');
        }

        /* Where new eq would be (faint marker) */
        if (eq1.P > 0 && eq1.Q > 0) {
          dynamicG.append('circle')
            .attr('cx', xScale(eq1.Q)).attr('cy', yScale(eq1.P))
            .attr('r', 4).attr('fill', 'none')
            .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,2');
        }

        /* Wait time calculation */
        var ratio = QsAtCeil > 0 ? shortage / QsAtCeil : 0;
        var waitMin = Math.min(MAX_WAIT, WAIT_K * ratio * ratio);

        var PdAtCeilInfo = shortage > 0 ? (newDA - QsAtCeil) / (-dB) : P0;
        var DWL = 0.5 * (eq1.Q - QsAtCeil) * (PdAtCeilInfo - P0);

        d3.select('#info-08').html(
          '<strong>Surge OFF</strong> \u2014 price stuck at $' + MT.fmt(P0, 0) +
          '<br><strong>Q<sub>S</sub>:</strong> ' + MT.fmt(QsAtCeil, 0) +
          '&ensp;<strong>Q<sub>D</sub>:</strong> ' + MT.fmt(QdAtCeil, 0) +
          '&ensp;<strong>Shortage:</strong> ' + MT.fmt(shortage, 0) + ' rides' +
          '<br><strong style="color:' + colors.dwlStroke + '">DWL:</strong> ' + MT.fmt(DWL, 0) +
          '&ensp;<strong>Est. extra wait:</strong> ~' + MT.fmt(waitMin, 0) + ' min' +
          '<br><em>When price can\u2019t ration, time does \u2014 and value is destroyed.</em>'
        );

        MT.updateMath('math-08',
          '\\text{Shortage} = Q_D\'(P^*) - Q_S(P^*) = ' +
          MT.fmt(QdAtCeil, 0) + '-' + MT.fmt(QsAtCeil, 0) + '=' + MT.fmt(shortage, 0) +
          ',\\;\\text{DWL}=' + MT.fmt(DWL, 0));
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
