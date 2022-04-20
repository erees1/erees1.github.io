document.addEventListener("DOMContentLoaded", init, false);

function init() {
  console.log("highlight-contents.js");
  const anchors = $("body").find("h2");

  $(window).scroll(function () {
    var scrollTop = $(document).scrollTop();

    // highlight the last scrolled-to: set everything inactive first
    for (var i = 0; i < anchors.length; i++) {
      $(
        '#TOC div ul li a[href="#' + $(anchors[i]).attr("id") + '"]'
      ).removeClass("active");
    }

    // then iterate backwards, on the first match highlight it and break
    for (var i = anchors.length - 1; i >= 0; i--) {
      if (scrollTop > $(anchors[i]).offset().top - 75) {
        $(
          '#TOC div ul li a[href="#' + $(anchors[i]).attr("id") + '"]'
        ).addClass("active");
        break;
      }
    }
  });
}
