document.addEventListener("DOMContentLoaded", init, false);

function init() {
  const anchors = $("body").find("h2, h3");
  const TOC_links = $("#TOC").find("li a");

  // add "<span class='indicator'> •</span>" after each TOC link
  for (var i = 0; i < TOC_links.length; i++) {
    $(TOC_links[i]).append("<span class='indicator'>&nbsp•</span>");
  }

  $(window).scroll(function () {
    var scrollTop = $(document).scrollTop();

    // iterate through TOC_links and remove active class
    for (var j = 0; j < TOC_links.length; j++) {
      $(TOC_links[j]).removeClass("active");
    }

    // then iterate backwards, on the first match highlight it and break
    for (var i = anchors.length - 1; i >= 0; i--) {
      if (scrollTop > $(anchors[i]).offset().top - 75) {
        const id = $(anchors[i]).attr("id");
        // if id undefined then skip
        if (id === undefined) {
          continue;
        }
        for (var j = 0; j < TOC_links.length; j++) {
          // if id matches href in TOC_links then add class active
          if ($(TOC_links[j]).attr("href") === "#" + id) {
            $(TOC_links[j]).addClass("active");
          }
        }
        break;
      }
    }
  });
}
