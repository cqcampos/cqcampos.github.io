/* Viz 19 — Opportunity Cost
   Two examples:
   1. MBA at Booth: tuition (explicit) + foregone salary (opportunity)
   2. Restaurant: Own vs Rent — owning shifts cost from explicit to
      opportunity, but total economic cost is the same.               */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = {
      scenario: 'building',
      /* Building */
      rent: 5, opCost: 3,
      /* MBA */
      salary: 120, tuition: 55, years: 2
    };

    MT.addDropdown('controls-19', {
      label: 'Choose example',
      value: 'building',
      options: [
        { value: 'building', label: 'Restaurant: Own vs Rent' },
        { value: 'mba', label: 'MBA at Booth' }
      ],
      onChange: function (v) { state.scenario = v; buildControls(); render(); }
    });

    d3.select('#controls-19').append('div').attr('id', 'ctrl19d');

    var chart;

    function buildControls() {
      d3.select('#ctrl19d').selectAll('*').remove();
      if (state.scenario === 'building') {
        MT.addSlider('ctrl19d', {
          label: 'Market rent ($k/mo)', min: 1, max: 15, value: state.rent, step: 0.5,
          format: function (v) { return '$' + v.toFixed(1) + 'k'; },
          onChange: function (v) { state.rent = v; update(); }
        });
        MT.addSlider('ctrl19d', {
          label: 'Operating costs ($k/mo)', min: 0.5, max: 10, value: state.opCost, step: 0.5,
          format: function (v) { return '$' + v.toFixed(1) + 'k'; },
          onChange: function (v) { state.opCost = v; update(); }
        });
      } else {
        MT.addSlider('ctrl19d', {
          label: 'Pre-MBA salary ($k/yr)', min: 50, max: 250, value: state.salary, step: 5,
          format: function (v) { return '$' + v + 'k'; },
          onChange: function (v) { state.salary = v; update(); }
        });
        MT.addSlider('ctrl19d', {
          label: 'Tuition ($k/yr)', min: 20, max: 80, value: state.tuition, step: 5,
          format: function (v) { return '$' + v + 'k'; },
          onChange: function (v) { state.tuition = v; update(); }
        });
        MT.addSlider('ctrl19d', {
          label: 'Program length (years)', min: 1, max: 3, value: state.years, step: 1,
          onChange: function (v) { state.years = v; update(); }
        });
      }
    }

    function render() {
      chart = MT.createChart('chart-19', { height: 400 });
      drawContent();
    }

    function update() {
      if (!chart) { render(); return; }
      chart.plotArea.selectAll('*').remove();
      drawContent();
    }

    function drawContent() {
      var colors = MT.getColors();
      if (state.scenario === 'building') drawBuilding(colors);
      else drawMBA(colors);
    }

    /* =================== Restaurant: Own vs Rent =================== */
    function drawBuilding(colors) {
      var rent = state.rent, opCost = state.opCost;
      var econCost = rent + opCost;

      var W = chart.innerWidth, H = chart.innerHeight;
      var barW = W * 0.22;
      var x1 = W * 0.12, x2 = W * 0.56;
      var padTop = 45, padBot = 55;
      var maxVal = econCost * 1.25;
      var barArea = H - padTop - padBot;
      var baseY = H - padBot;

      function barH(v) { return (v / maxVal) * barArea; }

      var hOp = barH(opCost);
      var hRent = barH(rent);

      /* Titles */
      chart.plotArea.append('text')
        .attr('x', x1 + barW / 2).attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('You OWN the Building');
      chart.plotArea.append('text')
        .attr('x', x2 + barW / 2).attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('You RENT the Building');

      /* Bar 1 (Own): Operating + Foregone rent */
      chart.plotArea.append('rect')
        .attr('x', x1).attr('y', baseY - hOp)
        .attr('width', barW).attr('height', hOp)
        .attr('fill', colors.demand).attr('opacity', 0.75);
      if (hOp > 25) {
        chart.plotArea.append('text')
          .attr('x', x1 + barW / 2).attr('y', baseY - hOp / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '11px').style('font-weight', 'bold')
          .text('Operating: $' + MT.fmt(opCost, 1) + 'k');
      }

      chart.plotArea.append('rect')
        .attr('x', x1).attr('y', baseY - hOp - hRent)
        .attr('width', barW).attr('height', hRent)
        .attr('fill', colors.priceLine).attr('opacity', 0.75).attr('rx', 3);
      if (hRent > 25) {
        chart.plotArea.append('text')
          .attr('x', x1 + barW / 2).attr('y', baseY - hOp - hRent / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '11px').style('font-weight', 'bold')
          .text('Foregone rent: $' + MT.fmt(rent, 1) + 'k');
      }

      chart.plotArea.append('text')
        .attr('x', x1 + barW + 6).attr('y', baseY - hOp - hRent / 2 + 4)
        .style('fill', colors.priceLine).style('font-size', '10px').style('font-weight', 'bold')
        .text('\u2190 Opportunity');
      chart.plotArea.append('text')
        .attr('x', x1 + barW + 6).attr('y', baseY - hOp / 2 + 4)
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('\u2190 Explicit');

      /* Bar 2 (Rent): Operating + Rent payment */
      chart.plotArea.append('rect')
        .attr('x', x2).attr('y', baseY - hOp)
        .attr('width', barW).attr('height', hOp)
        .attr('fill', colors.demand).attr('opacity', 0.75);
      if (hOp > 25) {
        chart.plotArea.append('text')
          .attr('x', x2 + barW / 2).attr('y', baseY - hOp / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '11px').style('font-weight', 'bold')
          .text('Operating: $' + MT.fmt(opCost, 1) + 'k');
      }

      chart.plotArea.append('rect')
        .attr('x', x2).attr('y', baseY - hOp - hRent)
        .attr('width', barW).attr('height', hRent)
        .attr('fill', colors.demand).attr('opacity', 0.55).attr('rx', 3);
      if (hRent > 25) {
        chart.plotArea.append('text')
          .attr('x', x2 + barW / 2).attr('y', baseY - hOp - hRent / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '11px').style('font-weight', 'bold')
          .text('Rent: $' + MT.fmt(rent, 1) + 'k');
      }

      chart.plotArea.append('text')
        .attr('x', x2 + barW + 6).attr('y', baseY - hOp - hRent / 2 + 4)
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('\u2190 Explicit');
      chart.plotArea.append('text')
        .attr('x', x2 + barW + 6).attr('y', baseY - hOp / 2 + 4)
        .style('fill', colors.demand).style('font-size', '10px').style('font-weight', 'bold')
        .text('\u2190 Explicit');

      /* Equality line */
      var totalY = baseY - hOp - hRent;
      chart.plotArea.append('line')
        .attr('x1', x1).attr('y1', totalY)
        .attr('x2', x2 + barW).attr('y2', totalY)
        .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3');

      var midX = (x1 + barW + x2) / 2;
      chart.plotArea.append('text')
        .attr('x', midX).attr('y', totalY - 8)
        .attr('text-anchor', 'middle')
        .style('fill', colors.equilibrium).style('font-size', '13px').style('font-weight', 'bold')
        .text('Same economic cost!');

      /* Accounting cost dashed line for "Own" */
      chart.plotArea.append('line')
        .attr('x1', x1 - 5).attr('y1', baseY - hOp)
        .attr('x2', x1 + barW + 5).attr('y2', baseY - hOp)
        .attr('stroke', colors.textLight).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
      chart.plotArea.append('text')
        .attr('x', x1 - 8).attr('y', baseY - hOp + 4)
        .attr('text-anchor', 'end')
        .style('fill', colors.textLight).style('font-size', '9px')
        .text('Acct cost');

      /* Totals below bars */
      chart.plotArea.append('text')
        .attr('x', x1 + barW / 2).attr('y', baseY + 16)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Economic: $' + MT.fmt(econCost, 1) + 'k/mo');
      chart.plotArea.append('text')
        .attr('x', x1 + barW / 2).attr('y', baseY + 32)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '11px')
        .text('Accounting: $' + MT.fmt(opCost, 1) + 'k/mo');

      chart.plotArea.append('text')
        .attr('x', x2 + barW / 2).attr('y', baseY + 16)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '12px').style('font-weight', 'bold')
        .text('Economic: $' + MT.fmt(econCost, 1) + 'k/mo');
      chart.plotArea.append('text')
        .attr('x', x2 + barW / 2).attr('y', baseY + 32)
        .attr('text-anchor', 'middle')
        .style('fill', colors.textLight).style('font-size', '11px')
        .text('Accounting: $' + MT.fmt(econCost, 1) + 'k/mo');

      /* Info */
      d3.select('#info-19').html(
        '<strong>Own the building:</strong>' +
        '<br>Accounting cost = Operating = <strong>$' + MT.fmt(opCost, 1) + 'k/mo</strong> <em>(looks cheap!)</em>' +
        '<br>Economic cost = Operating + <span style="color:' + colors.priceLine + ';font-weight:bold">Foregone rent ($' + MT.fmt(rent, 1) + 'k)</span> = <strong>$' + MT.fmt(econCost, 1) + 'k/mo</strong>' +
        '<br><strong>Rent the building:</strong>' +
        '<br>Accounting cost = Economic cost = Operating + Rent = <strong>$' + MT.fmt(econCost, 1) + 'k/mo</strong>' +
        '<br><em>Owning the building doesn\u2019t make it free \u2014 it just shifts $' + MT.fmt(rent, 1) + 'k/mo from explicit rent to opportunity cost. Total economic cost: <strong>identical</strong>.</em>'
      );

      /* Math */
      var el = document.getElementById('math-19');
      if (el) {
        el.innerHTML =
          '\\(\\text{Own: } \\underbrace{\\$' + MT.fmt(opCost, 1) + 'k}_{\\text{Explicit}} + \\underbrace{\\$' + MT.fmt(rent, 1) + 'k}_{\\text{Opportunity}} = \\$' + MT.fmt(econCost, 1) + 'k\\)' +
          '<br>' +
          '\\(\\text{Rent: } \\underbrace{\\$' + MT.fmt(opCost, 1) + 'k + \\$' + MT.fmt(rent, 1) + 'k}_{\\text{All explicit}} = \\$' + MT.fmt(econCost, 1) + 'k\\)';
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]);
      }
    }

    /* =================== MBA at Booth =================== */
    function drawMBA(colors) {
      var acctCost = state.tuition * state.years;
      var oppCost  = state.salary * state.years;
      var econCost = acctCost + oppCost;

      var W = chart.innerWidth, H = chart.innerHeight;
      var barW = W * 0.22;
      var x1 = W * 0.15, x2 = W * 0.55;
      var padTop = 45, padBot = 30;
      var maxVal = econCost * 1.08;
      var barArea = H - padTop - padBot;
      var baseY = H - padBot;

      function barH(v) { return (v / maxVal) * barArea; }

      /* Titles */
      chart.plotArea.append('text')
        .attr('x', x1 + barW / 2).attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('Accounting Cost');
      chart.plotArea.append('text')
        .attr('x', x2 + barW / 2).attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('Economic Cost');

      /* Bar 1: Tuition only */
      var h1 = barH(acctCost);
      chart.plotArea.append('rect')
        .attr('x', x1).attr('y', baseY - h1)
        .attr('width', barW).attr('height', h1)
        .attr('fill', colors.demand).attr('opacity', 0.75).attr('rx', 3);
      if (h1 > 30) {
        chart.plotArea.append('text')
          .attr('x', x1 + barW / 2).attr('y', baseY - h1 / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '12px').style('font-weight', 'bold')
          .text('Tuition: $' + acctCost + 'k');
      }

      /* Bar 2: Tuition (bottom) + Foregone salary (top) */
      var hTuit = barH(acctCost);
      var hOpp  = barH(oppCost);
      chart.plotArea.append('rect')
        .attr('x', x2).attr('y', baseY - hTuit)
        .attr('width', barW).attr('height', hTuit)
        .attr('fill', colors.demand).attr('opacity', 0.75);
      if (hTuit > 30) {
        chart.plotArea.append('text')
          .attr('x', x2 + barW / 2).attr('y', baseY - hTuit / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '12px').style('font-weight', 'bold')
          .text('Tuition: $' + acctCost + 'k');
      }
      chart.plotArea.append('rect')
        .attr('x', x2).attr('y', baseY - hTuit - hOpp)
        .attr('width', barW).attr('height', hOpp)
        .attr('fill', colors.priceLine).attr('opacity', 0.75).attr('rx', 3);
      if (hOpp > 30) {
        chart.plotArea.append('text')
          .attr('x', x2 + barW / 2).attr('y', baseY - hTuit - hOpp / 2 + 5)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff').style('font-size', '12px').style('font-weight', 'bold')
          .text('Foregone salary: $' + oppCost + 'k');
      }

      /* Totals below bars */
      chart.plotArea.append('text')
        .attr('x', x1 + barW / 2).attr('y', baseY + 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('$' + acctCost + 'k');
      chart.plotArea.append('text')
        .attr('x', x2 + barW / 2).attr('y', baseY + 18)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text).style('font-size', '13px').style('font-weight', 'bold')
        .text('$' + econCost + 'k');

      /* Annotation between bars */
      var midX = (x1 + barW + x2) / 2;
      var annY = baseY - hTuit - hOpp / 2;
      if (annY < padTop + 10) annY = padTop + 10;
      chart.plotArea.append('text')
        .attr('x', midX).attr('y', annY)
        .attr('text-anchor', 'middle')
        .style('fill', colors.priceLine).style('font-size', '12px').style('font-weight', 'bold')
        .text('+$' + oppCost + 'k');
      chart.plotArea.append('text')
        .attr('x', midX).attr('y', annY + 14)
        .attr('text-anchor', 'middle')
        .style('fill', colors.priceLine).style('font-size', '10px')
        .text('opportunity cost');

      /* Info */
      d3.select('#info-19').html(
        '<strong>Accounting cost</strong> (checks you write): Tuition = $' + state.tuition + 'k \u00D7 ' + state.years + ' yr = <strong>$' + acctCost + 'k</strong>' +
        '<br><strong style="color:' + colors.priceLine + '">Opportunity cost</strong> (what you give up): Salary = $' + state.salary + 'k \u00D7 ' + state.years + ' yr = <strong style="color:' + colors.priceLine + '">$' + oppCost + 'k</strong>' +
        '<br><strong>Economic cost:</strong> $' + acctCost + 'k + $' + oppCost + 'k = <strong>$' + econCost + 'k</strong>' +
        '<br><em>An accountant sees $' + acctCost + 'k in costs. An economist sees $' + econCost + 'k \u2014 the foregone salary is a real cost of your MBA even though you never write a check for it.</em>'
      );

      /* Math */
      var el = document.getElementById('math-19');
      if (el) {
        el.innerHTML = '\\(\\text{Economic Cost} = \\underbrace{\\$' + acctCost + 'k}_{\\text{Tuition}} + \\underbrace{\\$' + oppCost + 'k}_{\\text{Foregone salary}} = \\$' + econCost + 'k\\)';
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]);
      }
    }

    buildControls();
    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
