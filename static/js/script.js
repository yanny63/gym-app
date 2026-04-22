const langs_btn = document.querySelector(".langs-btn")
const lang_options = document.querySelector(".langs")

function langs_open() {
    lang_options.classList.remove('not-visible')
}
function langs_close() {
    lang_options.classList.add('not-visible')
}


langs_btn.addEventListener("mouseover", langs_open)

langs_btn.addEventListener("mouseleave", () => {
    if (!lang_options.matches(":hover") && !langs_btn.matches(":hover")) {
        langs_close()
    }
})
lang_options.addEventListener("mouseleave", () => {
    if (!langs_btn.matches(":hover") && !lang_options.matches(":hover")) {
        langs_close()
    }
})


const nav = document.querySelector(".top_nav")
let last_scroll
let current_scroll

document.onscroll = () => {
    current_scroll = window.scrollY
    console.log(current_scroll)
    if (current_scroll > last_scroll) {
        nav.classList.add('nav-not_visible')
    }
    else {
        nav.classList.remove('nav-not_visible')
    }
    last_scroll = current_scroll
}