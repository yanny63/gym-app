const timer = document.querySelector("#timer")
const saved_container = document.querySelector(".saved-timestamps")
let seconds = 0
let interval = null
let list = []

function format(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function start() {
    if (interval) return
    let start = Date.now()
    interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000)
        timer.textContent = format(elapsed)
    }, 100);
    document.querySelector(".flag svg").style.animation = ''
    document.querySelector(".flag").classList.remove('not-visible')
}

function stop_interval() {
    clearInterval(interval)
    interval = null
    document.querySelector(".flag svg").style.animation = 'none'
}

function reset() {
    stop_interval()
    seconds = 0
    timer.textContent = '00:00:00'
    document.querySelector(".flag").classList.add('not-visible')
    resetTimestamps()
}

function save() {
    const current_time = timer.textContent
    list.push(current_time)
    updateTimestamps()
}


function updateTimestamps() {
    saved_container.innerHTML = ''
    list.forEach(timestamp => {
        const div = document.createElement('div')
        div.classList.add('timestamp')
        div.innerText = timestamp
        saved_container.append(div)
    })
}

function resetTimestamps() {
    saved_container.innerHTML = ''
    list = []
}