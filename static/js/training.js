document.addEventListener("DOMContentLoaded", async () => {
    setTimeout(() => {
        document.querySelector(".loader").classList.add("not-visible")
        document.querySelector(".training-article").classList.remove("not-visible")
    }, 3000);
    // try {
    //     const res = await fetch(``)
    //     if (!res.ok) {
    //         throw new Error(res.status)
    //     }
    //     const data = await res.json()

    // }
})