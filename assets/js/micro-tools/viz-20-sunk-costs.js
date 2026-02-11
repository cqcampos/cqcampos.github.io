/* Viz 20 — The Sunk Cost Fallacy
   Two examples:
   1. Fighter Jet: $50B sunk, adjustable remaining cost, fixed value.
      Shows how sunk costs can lead to wrongly continuing OR wrongly stopping.
   2. Concert Ticket: lost $100 ticket vs lost $100 cash.
      Shows mental accounting — identical situations feel different.   */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = {
      scenario: 'jet',
      /* Fighter jet */
      remaining: 60,
      /* Concert ticket */
      concertValue: 150,
      ticketPrice: 100
    };

    var SUNK = 50;       /* $50B already spent on jet */
    var JET_VALUE = 80;  /* $80B value of completed jet */

    MT.addDropdown('controls-20', {
      label: 'Choose example',
      value: 'jet',
      options: [
        { value: 'jet', label: 'Fighter Jet Investment' },
        { value: 'concert', label: 'Lost Concert Ticket' }
      ],
      onChange: function (v) { state.scenario = v; buildControls(); render(); }
    });

    d3.select('#controls-20').append('div').attr('id', 'ctrl20d');

    var chart;

    function buildControls() {
      d3.select('#ctrl20d').selectAll('*').remove();
      if (state.scenario === 'jet') {
        MT.addSlider('ctrl20d', {
          label: 'Remaining cost to complete ($B)', min: 10, max: 150, value: state.remaining, step: 5,
          format: function (v) { return '$' + v + 'B'; },
          onChange: function (v) { state.remaining = v; update(); }
        });
      } else {
        MT.addSlider('ctrl20d', {
          label: 'Concert value to you', min: 50, max: 300, value: state.concertValue, step: 10,
          format: function (v) { return '$' + v; },
          onChange: function (v) { state.concertValue = v; update(); }
        });
        MT.addSlider('ctrl20d', {
          label: 'Ticket price', min: 50, max: 200, value: state.ticketPrice, step: 10,
          format: function (v) { return '$' + v; },
          onChange: function (v) { state.ticketPrice = v; update(); }
        });
      }
    }

    function render() {
      chart = MT.createChart('chart-20', { height: 400 });
      drawContent();
    }

    function update() {
      if (!chart) { render(); return; }
      chart.plotArea.selectAll('*').remove();
      drawContent();
    }

    function drawContent() {
      var colors = MT.getColors();
      if (state.scenario === 'jet') drawJet(colors);
      else drawConcert(colors);
    }

    /* =================== Fighter Jet =================== */
    function drawJet(colors) {
      var remaining = state.remaining, sunk = SUNK, value = JET_VALUE;
      var total = sunk + remaining;

      var shouldContinue = remaining < value;
      var indifferent = remaining === value;

      var W = chart.innerWidth, H = chart.innerHeight;
      var barW = W * 0.1;
      var padTop = 55, padBot = 40;

      /* Two comparison groups side by side */
      var gapInner = barW * 0.4;
      var gapOuter = W * 0.1;
      var groupW = barW * 2 + gapInner;
      var totalW = groupW * 2 + gapOuter;
      var startX = (W - totalW) / 2;

      var xVL = startX;
      var xRL = startX + barW + gapInner;
      var xVR = startX + groupW + gapOuter;
      var xTR = xVR + barW + gapInner;

      /* Scale */
      var maxVal = Math.max(value, total) * 1.15;
      var barArea = H - padTop - padBot;
      var baseY = H - padBot;
      function barH(v) { return (v / maxVal) * barArea; }

      /* Determine if analyses disagree */
      var correctLabel, fallacyLabel;
      var disagree = false;
      if (indifferent) {
        correctLabel = 'Indifferent';
      } else {
        correctLabel = shouldContinue ? 'Continue \u2713' : 'Stop \u2713';
      }

      /* Sunk cost fallacy works in BOTH directions:
         - When correct=Continue but total > value → fallacy says "Stop" (looks too expensive)
         - When correct=Stop → fallacy says "Continue" (commitment: "can't waste $50B!") */
      if (indifferent) {
        fallacyLabel = 'Indifferent';
      } else if (shouldContinue) {
        /* Correct = Continue. Does including sunk costs flip the decision? */
        if (total > value) {
          fallacyLabel = 'Stop \u2717 WRONG';
          disagree = true;
        } else {
          fallacyLabel = 'Continue \u2713';
        }
      } else {
        /* Correct = Stop. Commitment fallacy: "We already spent $50B, can't quit now!" */
        fallacyLabel = 'Continue \u2717 WRONG';
        disagree = true;
      }

      /* Group titles */
      chart.plotArea.append('text')
        .attr('x', (xVL + xRL + barW) / 2).attr('y', 16)
        .attr('text-anchor', 'middle')
        .style('fill', colors.positive).style('font-size', '13px').style('font-weight', 'bold')
        .text('Correct Analysis');
      chart.plotArea.append('text')
        .attr('x', (xVR + xTR + barW) / 2).attr('y', 16)
        .attr('text-anchor', 'middle')
        .style('fill', disagree ? colors.negative : colors.textLight).style('font-size', '13px').style('font-weight', 'bold')
        .text('Sunk Cost Thinking');

      /* Decision labels */
      chart.plotArea.append('text')
        .attr('x', (xVL + xRL + barW) / 2).attr('y', 34)
        .attr('text-anchor', 'middle')
        .style('fill', colors.positive).style('font-size', '12px')
        .text(correctLabel);
      chart.plotArea.append('text')
        .attr('x', (xVR + xTR + barW) / 2).attr('y', 34)
        .attr('text-anchor', 'middle')
        .style('fill', disagree ? colors.negative : colors.textLight).style('font-size', '12px')
        .text(fallacyLabel);

      /* ---- Left group: Value vs Remaining ---- */
      var hV = barH(value);
      /* Value bar */
      chart.plotArea.append('rect')
        .attr('x', xVL).attr('y', baseY - hV)
        .attr('width', barW).attr('height', hV)
        .attr('fill', colors.positive).attr('opacity', 0.7).attr('rx', 2);
      chart.plotArea.append('text')
        .attr('x', xVL + barW / 2).attr('y', baseY - hV - 6)
        .attr('text-anchor', 'middle')
        .style('fill', colors.positive).style('font-size', '11px').style('font-weight', 'bold')
        .text('$' + value + 'B');
      chart.plotArea.append('text')
        .attr('x', xVL + barW / 2).attr('y', baseY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '10px')
        .text('Value');

      /* Remaining cost bar */
      var hR = barH(remaining);
      chart.plotArea.append('rect')
        .attr('x', xRL).attr('y', baseY - hR)
        .attr('width', barW).attr('height', hR)
        .attr('fill', colors.negative).attr('opacity', 0.7).attr('rx', 2);
      chart.plotArea.append('text')
        .attr('x', xRL + barW / 2).attr('y', baseY - hR - 6)
        .attr('text-anchor', 'middle')
        .style('fill', colors.negative).style('font-size', '11px').style('font-weight', 'bold')
        .text('$' + remaining + 'B');
      chart.plotArea.append('text')
        .attr('x', xRL + barW / 2).attr('y', baseY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '10px')
        .text('Remaining');

      /* Comparison symbol */
      var cmpL = remaining < value ? '>' : (remaining > value ? '<' : '=');
      chart.plotArea.append('text')
        .attr('x', (xVL + barW + xRL) / 2).attr('y', baseY - Math.min(hV, hR) / 2)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '20px').style('font-weight', 'bold')
        .text(cmpL);

      /* ---- Right group: Value vs Total (sunk + remaining) ---- */
      /* Value bar */
      chart.plotArea.append('rect')
        .attr('x', xVR).attr('y', baseY - hV)
        .attr('width', barW).attr('height', hV)
        .attr('fill', colors.positive).attr('opacity', 0.7).attr('rx', 2);
      chart.plotArea.append('text')
        .attr('x', xVR + barW / 2).attr('y', baseY - hV - 6)
        .attr('text-anchor', 'middle')
        .style('fill', colors.positive).style('font-size', '11px').style('font-weight', 'bold')
        .text('$' + value + 'B');
      chart.plotArea.append('text')
        .attr('x', xVR + barW / 2).attr('y', baseY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '10px')
        .text('Value');

      /* Total cost bar: remaining (bottom) + sunk (top, grayed) */
      var hS = barH(sunk);
      var hT = hR + hS;
      chart.plotArea.append('rect')
        .attr('x', xTR).attr('y', baseY - hR)
        .attr('width', barW).attr('height', hR)
        .attr('fill', colors.negative).attr('opacity', 0.7);
      chart.plotArea.append('rect')
        .attr('x', xTR).attr('y', baseY - hT)
        .attr('width', barW).attr('height', hS)
        .attr('fill', colors.textLight).attr('opacity', 0.35).attr('rx', 2);

      /* Labels inside total bar */
      if (hR > 22) {
        chart.plotArea.append('text')
          .attr('x', xTR + barW / 2).attr('y', baseY - hR / 2 + 4)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '9px').style('font-weight', 'bold')
          .text('$' + remaining + 'B');
      }
      if (hS > 22) {
        chart.plotArea.append('text')
          .attr('x', xTR + barW / 2).attr('y', baseY - hR - hS / 2 + 4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.text).style('font-size', '9px')
          .text('Sunk $' + sunk + 'B');
      }
      chart.plotArea.append('text')
        .attr('x', xTR + barW / 2).attr('y', baseY - hT - 6)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '11px').style('font-weight', 'bold')
        .text('$' + total + 'B');
      chart.plotArea.append('text')
        .attr('x', xTR + barW / 2).attr('y', baseY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '10px')
        .text('"Total"');

      /* Comparison symbol */
      var cmpR = total < value ? '>' : (total > value ? '<' : '=');
      chart.plotArea.append('text')
        .attr('x', (xVR + barW + xTR) / 2).attr('y', baseY - Math.min(hV, hT) / 2)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '20px').style('font-weight', 'bold')
        .text(cmpR);

      /* Warning box when analyses disagree */
      if (disagree) {
        chart.plotArea.append('rect')
          .attr('x', xVR - 10).attr('y', padTop - 15)
          .attr('width', xTR + barW - xVR + 20).attr('height', baseY - padTop + 35)
          .attr('fill', 'none')
          .attr('stroke', colors.negative).attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
          .attr('rx', 6);
      }

      /* Fallacy annotation when correct=Stop: commitment fallacy */
      if (!shouldContinue && !indifferent) {
        var annotX = xTR + barW + 8;
        var annotY = baseY - hR - hS / 2;
        chart.plotArea.append('text')
          .attr('x', annotX + 2).attr('y', annotY - 2)
          .style('fill', colors.negative).style('font-size', '10px').style('font-weight', 'bold')
          .text('\u201CCan\u2019t waste $' + sunk + 'B!\u201D');
        chart.plotArea.append('line')
          .attr('x1', annotX).attr('y1', annotY + 2)
          .attr('x2', xTR + barW + 2).attr('y2', annotY + 2)
          .attr('stroke', colors.negative).attr('stroke-width', 1.2)
          .attr('marker-end', 'none');
      }

      /* Fallacy annotation when correct=Continue: sunk costs make it look too expensive */
      if (shouldContinue && disagree) {
        var annotX2 = xTR + barW + 8;
        var annotY2 = baseY - hR - hS / 2;
        chart.plotArea.append('text')
          .attr('x', annotX2 + 2).attr('y', annotY2 - 2)
          .style('fill', colors.negative).style('font-size', '10px').style('font-weight', 'bold')
          .text('\u201C$' + total + 'B total \u2014 not worth it!\u201D');
        chart.plotArea.append('line')
          .attr('x1', annotX2).attr('y1', annotY2 + 2)
          .attr('x2', xTR + barW + 2).attr('y2', annotY2 + 2)
          .attr('stroke', colors.negative).attr('stroke-width', 1.2)
          .attr('marker-end', 'none');
      }

      /* ---- Info panel ---- */
      var html = '<strong>Value of completed jet:</strong> $' + value + 'B (fixed)' +
        '&ensp;<strong>Already spent (sunk):</strong> $' + sunk + 'B' +
        '&ensp;<strong>Remaining cost:</strong> $' + remaining + 'B';

      if (indifferent) {
        html += '<br><strong>Correct: Indifferent</strong> \u2014 Value = Remaining cost.';
      } else if (shouldContinue) {
        html += '<br><strong style="color:' + colors.positive + '">Correct: Continue</strong> \u2014 Value ($' + value + 'B) > Remaining cost ($' + remaining + 'B).';
        if (disagree) {
          html += '<br><em style="color:' + colors.negative + '">Sunk cost trap: "Total cost = $' + sunk + 'B + $' + remaining + 'B = $' + total + 'B, which is more than $' + value + 'B \u2014 not worth it!" Wrong! The $' + sunk + 'B is already gone. Only the remaining $' + remaining + 'B matters, and it\u2019s less than the $' + value + 'B value.</em>';
        }
      } else {
        html += '<br><strong style="color:' + colors.positive + '">Correct: Stop</strong> \u2014 Remaining cost ($' + remaining + 'B) > Value ($' + value + 'B).';
        html += '<br><em style="color:' + colors.negative + '">Sunk cost trap: "We already spent $' + sunk + 'B \u2014 we can\u2019t quit now!" Wrong! The $' + sunk + 'B is gone regardless. Spending $' + remaining + 'B more for only $' + value + 'B of value is throwing good money after bad.</em>';
      }

      html += '<br><em>Move the remaining cost slider. The $' + sunk + 'B sunk cost never changes the right framework \u2014 always compare remaining cost to value.</em>';
      d3.select('#info-20').html(html);

      /* Math */
      var cmpMath = shouldContinue ? '>' : (indifferent ? '=' : '<');
      var el = document.getElementById('math-20');
      if (el) {
        el.innerHTML = '\\(\\text{Continue if } \\underbrace{\\$' + value + 'B}_{\\text{Value}} > \\underbrace{\\$' + remaining + 'B}_{\\text{Remaining cost}} \\quad (' + cmpMath + ')\\)' +
          '&emsp;\\(\\text{Sunk \\$' + sunk + 'B: irrelevant}\\)';
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]);
      }
    }

    /* =================== Concert Ticket =================== */
    function drawConcert(colors) {
      var value = state.concertValue, price = state.ticketPrice;
      var shouldBuy = value > price;
      var mentalTotal = 2 * price;
      var mentalTrap = shouldBuy && value < mentalTotal;

      var W = chart.innerWidth, H = chart.innerHeight;
      var colW = W * 0.38;
      var x1 = W * 0.04, x2 = W * 0.54;
      var padTop = 10;

      /* ---- Column headers ---- */
      chart.plotArea.append('text')
        .attr('x', x1 + colW / 2).attr('y', padTop + 20)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '14px').style('font-weight', 'bold')
        .text('You Lost Your $' + price + ' Ticket');
      chart.plotArea.append('text')
        .attr('x', x2 + colW / 2).attr('y', padTop + 20)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '14px').style('font-weight', 'bold')
        .text('You Lost $' + price + ' in Cash');

      var rowY = padTop + 48;
      var rowH = 28;

      /* ---- Sunk cost row (crossed out) ---- */
      var sunkText1 = 'Sunk: lost ticket (\u2212$' + price + ')';
      var sunkText2 = 'Sunk: lost cash (\u2212$' + price + ')';

      chart.plotArea.append('text')
        .attr('x', x1 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '11px').style('opacity', 0.7)
        .text(sunkText1);
      drawStrike(chart.plotArea, x1 + 15, x1 + colW - 15, rowY + 10, colors);

      chart.plotArea.append('text')
        .attr('x', x2 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '11px').style('opacity', 0.7)
        .text(sunkText2);
      drawStrike(chart.plotArea, x2 + 15, x2 + colW - 15, rowY + 10, colors);

      /* ---- Divider ---- */
      rowY += rowH + 12;
      chart.plotArea.append('line')
        .attr('x1', x1).attr('y1', rowY)
        .attr('x2', x1 + colW).attr('y2', rowY)
        .attr('stroke', colors.axis).attr('stroke-width', 0.5);
      chart.plotArea.append('line')
        .attr('x1', x2).attr('y1', rowY)
        .attr('x2', x2 + colW).attr('y2', rowY)
        .attr('stroke', colors.axis).attr('stroke-width', 0.5);

      /* ---- Question ---- */
      rowY += 6;
      chart.plotArea.append('text')
        .attr('x', x1 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Buy a new ticket for $' + price + '?');
      chart.plotArea.append('text')
        .attr('x', x2 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Buy a ticket for $' + price + '?');

      /* ---- Value vs Price comparison ---- */
      rowY += rowH + 10;
      chart.plotArea.append('text')
        .attr('x', x1 + 10).attr('y', rowY + 14)
        .style('fill', colors.positive).style('font-size', '12px')
        .text('Value: $' + value);
      chart.plotArea.append('text')
        .attr('x', x1 + colW - 10).attr('y', rowY + 14)
        .attr('text-anchor', 'end')
        .style('fill', colors.negative).style('font-size', '12px')
        .text('Cost: $' + price);

      chart.plotArea.append('text')
        .attr('x', x2 + 10).attr('y', rowY + 14)
        .style('fill', colors.positive).style('font-size', '12px')
        .text('Value: $' + value);
      chart.plotArea.append('text')
        .attr('x', x2 + colW - 10).attr('y', rowY + 14)
        .attr('text-anchor', 'end')
        .style('fill', colors.negative).style('font-size', '12px')
        .text('Cost: $' + price);

      /* ---- Decision ---- */
      rowY += rowH + 8;
      var decColor = shouldBuy ? colors.positive : colors.negative;
      var decText = shouldBuy ? '\u2713 YES \u2014 $' + value + ' > $' + price : '\u2717 NO \u2014 $' + value + ' < $' + price;
      chart.plotArea.append('text')
        .attr('x', x1 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', decColor).style('font-size', '14px').style('font-weight', 'bold')
        .text(decText);
      chart.plotArea.append('text')
        .attr('x', x2 + colW / 2).attr('y', rowY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', decColor).style('font-size', '14px').style('font-weight', 'bold')
        .text(decText);

      /* ---- "Same decision!" connector ---- */
      rowY += rowH + 18;
      chart.plotArea.append('text')
        .attr('x', W / 2).attr('y', rowY)
        .attr('text-anchor', 'middle')
        .style('fill', colors.equilibrium).style('font-size', '14px').style('font-weight', 'bold')
        .text('\u2194 Same financial situation, same decision!');

      /* ---- Mental accounting trap ---- */
      if (mentalTrap) {
        rowY += 28;
        chart.plotArea.append('text')
          .attr('x', x1 + colW / 2).attr('y', rowY)
          .attr('text-anchor', 'middle')
          .style('fill', colors.negative).style('font-size', '11px').style('font-weight', 'bold')
          .text('\u26A0 Mental accounting trap:');
        chart.plotArea.append('text')
          .attr('x', x1 + colW / 2).attr('y', rowY + 16)
          .attr('text-anchor', 'middle')
          .style('fill', colors.negative).style('font-size', '11px')
          .text('"I\u2019d be spending $' + mentalTotal + ' on a $' + value + ' concert!"');
        chart.plotArea.append('text')
          .attr('x', x1 + colW / 2).attr('y', rowY + 32)
          .attr('text-anchor', 'middle')
          .style('fill', colors.textLight).style('font-size', '10px')
          .text('(But the first $' + price + ' is sunk!)');
      }

      /* ---- Info panel ---- */
      var html = '<strong>Both situations are identical:</strong> you\u2019re $' + price + ' poorer (sunk cost) and deciding whether to spend $' + price + ' on $' + value + ' of enjoyment.';

      if (shouldBuy) {
        html += '<br><strong style="color:' + colors.positive + '">Buy the ticket!</strong> Concert value ($' + value + ') > Ticket price ($' + price + ').';
        if (mentalTrap) {
          html += '<br><em style="color:' + colors.negative + '">Mental accounting trap: losing the ticket makes people think "I\u2019d be spending $' + mentalTotal + ' total on a $' + value + ' concert." But the lost $' + price + ' is gone either way! If you\u2019d still buy after losing $' + price + ' in cash, you should buy after losing the ticket too \u2014 it\u2019s the same situation.</em>';
        }
      } else {
        html += '<br><strong>Don\u2019t buy.</strong> Concert value ($' + value + ') \u2264 Ticket price ($' + price + ').';
        html += '<br><em>Not worth it regardless of the loss. Both scenarios agree.</em>';
      }

      d3.select('#info-20').html(html);

      /* Math */
      var el = document.getElementById('math-20');
      if (el) {
        var cmp = shouldBuy ? '>' : '\\leq';
        el.innerHTML = '\\(\\text{Buy if Value} > \\text{Price}: \\;\\$' + value + ' ' + cmp + ' \\$' + price + '\\)' +
          '&emsp;\\(\\text{Lost \\$' + price + ': sunk (irrelevant)}\\)';
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]);
      }
    }

    /* Helper: strikethrough line */
    function drawStrike(g, x1, x2, y, colors) {
      g.append('line')
        .attr('x1', x1).attr('y1', y)
        .attr('x2', x2).attr('y2', y)
        .attr('stroke', colors.negative).attr('stroke-width', 1.5).attr('opacity', 0.6);
    }

    buildControls();
    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
