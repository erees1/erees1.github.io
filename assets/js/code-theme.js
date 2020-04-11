
  function addToggleButton() {
    var x = document.getElementsByClassName("highlight");
    var i;
    for (i = 0; i < x.length; i++) {
      if (x[i].tagName == "PRE") {
        x[i].insertAdjacentHTML(
          "afterbegin",
          // '<div class="theme-switch-wrapper"><label class="theme-switch" for="checkbox"><input type="checkbox" id="checkbox" /><div class="slider round"></div></label><em>Enable Dark Mode!</em></div>'
          '<div class="button-wrapper"><button class="code-toggle theme-toggle" onclick="switchTheme()"><i class="fa fa-lg fa-adjust"></i></button><div>'
        );
      }
    }
  }

  const toggleSwitch = document.querySelector(
    '.theme-toggle input[type="checkbox"]'
  );

  // toggleSwitch.addEventListener("change", switchTheme, false);

  function switchTheme(e) {
    if (document.documentElement.getAttribute('code-theme') != 'dark') {
        document.documentElement.setAttribute('code-theme', 'dark');
        localStorage.setItem('theme', 'dark'); //add this
    }
    else {
        document.documentElement.setAttribute('code-theme', 'light');
        localStorage.setItem('theme', 'light'); //add this
    }    
}

const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

if (currentTheme) {
    document.documentElement.setAttribute('code-theme', currentTheme);

}