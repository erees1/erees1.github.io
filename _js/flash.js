const Groups1dx = ["#Group-6", "#Group-7"];
const Groups1dy = ["#Group-5"];
const Groups2d = ["#Group-2", "#Group-3", "#Group-4"];

d3.select("#Group-2")
  .selectAll("rect")
  .on("mouseover", function () {
    d3.select(this).call(mouseOver);
  })
  .on("mouseout", function () {
    d3.select(this).call(mouseOut);
  });
d3.select("#Group-3")
  .selectAll("rect")
  .on("mouseover", function () {
    d3.select(this).call(mouseOver);
  })
  .on("mouseout", function () {
    d3.select(this).call(mouseOut);
  });

function mouseOver(selection) {
  let x = selection.attr("x");
  let y = selection.attr("y");
  $('.hover-annotation').css('display', 'inline-block')

  Groups1dy.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[y='" + y + "']");
    highlight(others);
  });
  Groups1dx.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[x='" + x + "']");
    highlight(others);
  });
  Groups2d.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[y='" + y + "'][x='" + x + "']");
    highlight(others);
  });
}
function mouseOut(selection) {
  let x = selection.attr("x");
  let y = selection.attr("y");

  $('.hover-annotation').css('display', 'none')
  Groups1dy.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[y='" + y + "']");
    remove(others);
  });
  Groups1dx.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[x='" + x + "']");
    remove(others);
  });
  Groups2d.forEach(function (item, index) {
    var others = d3.select(item).selectAll("rect[y='" + y + "'][x='" + x + "']");
    remove(others);
  });
}

function highlight(selection) {
  selection.attr("fill", "orange");
}

function remove(selection) {
  selection.attr("fill", selection.color);
}
