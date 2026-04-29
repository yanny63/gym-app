const createWorkoutDiv = document.querySelector(".createWorkout")
const todaysWorkout = document.querySelector(".todays-workout-container")
const recentActivity = document.querySelector(".recent-activity-parent")
const noGoals = document.querySelector(".no-goals")
const currentGoals = document.querySelector(".current-goals-container")
const startWorkout = document.querySelector(".startWorkout") 

document.addEventListener("DOMContentLoaded", async () => {
    await todaysSession()
    await lastSessions()
})

async function todaysSession() {
    try {
        const res = await fetch(`/API/training`)
        if (res.status === 404) {
            todaysWorkout.classList.add("not-visible")
            todaysWorkout.style.display = 'none'   
            recentActivity.classList.add("not-visible")
            recentActivity.style.display = 'none' 
            currentGoals.classList.add("not-visible")
            currentGoals.style.display = 'none'
            document.querySelector(".sectionBreak").style.display = 'none'
            document.querySelector("#firstSectionBreak").style.display = 'none'
        }
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        createWorkoutDiv.style.display = 'none'
        const session = data.session
        const name = session.name
        const exercises = session.exercises
        const date = new Date();
        
        
        document.querySelector("#span-date").innerText = date.toISOString().split('T')[0]
        document.querySelector("#training-name").innerText = name
        
        document.querySelector(".createWorkout").classList.add('not-visible')
        document.querySelector(".todays-workout-container").classList.remove('not-visible')

        if (Object.keys(exercises).length > 0) {
            Object.values(exercises).forEach(exercise => {
                const div_parent = document.createElement('div')
                const div1 = document.createElement('div')
                const div2 = document.createElement('div')
                const div3 = document.createElement('div')
                div1.innerText = exercise.exercise
                div2.innerText = exercise.sets
                div3.innerText = exercise.reps
                
                div_parent.appendChild(div1)
                div_parent.appendChild(div2)
                div_parent.appendChild(div3)
                div_parent.classList.add('tableRow')
                div1.classList.add('rowItem')
                div2.classList.add('rowItem')
                div3.classList.add('rowItem')
                startWorkout.setAttribute('data-training', JSON.stringify(session))
                document.querySelector("#training-exercises-js-container").appendChild(div_parent)
            })
            document.querySelector(".createWorkout").classList.add('not-visible')
            document.querySelector(".todays-workout-container").classList.remove('not-visible')
        }
        else {
            document.querySelector(".createWorkout").classList.remove('not-visible')
            document.querySelector(".todays-workout-container").classList.add('not-visible')
        }

        const goals = data.goals
        if (goals.length > 0) {
            goals.forEach(goal => {
                const div = document.createElement('div')
                div.innerHTML = `<span>${goal.goal}</span><button class="current-goal-check" data-i18n="training:done" data-id="${goal.id}"></button>`
                div.classList.add('current-goal')
                document.querySelector(".goals").appendChild(div)
            })
            document.querySelector(".no-goals").classList.add('not-visible')
        }
        else {
            document.querySelector(".current-goals-container").classList.add('not-visible')
        }
        
        const r_activity = data.recent_activity
        if (r_activity.length > 0) {
            r_activity.forEach(activity => {
                const date = activity.date
                const exercises = activity.exercises
                const name = activity.training_name
                const training_id = activity.id
                dayjs.extend(dayjs_plugin_utc)
                dayjs.extend(dayjs_plugin_relativeTime)
                let lang = localStorage.getItem('lang') || navigator.language.split("-")[0]
                if (lang !== 'en' && lang !== 'pl' && lang !== 'es') {
                    lang = 'en'
                }
                dayjs.locale(lang)

                const div = document.createElement('div')
                div.classList.add('recent-activity')
                div.innerHTML = `
                <h3 class="recent-activity-header">${name} - <span data-date='${date}'>${dayjs.utc(date).local().fromNow()}</span></h3> 
                <button class="recent-activity-button" data-i18n="training:check-details" data-id='${training_id}'></button>`
                document.querySelector(".recent-activity-container").appendChild(div)
            })
            
        }
        updateContent()
        document.querySelector(".loader").classList.add("not-visible")
        document.querySelector(".training-article").classList.remove("not-visible")
    }
    catch (err) {
        console.log(`Error - ${err}`)
    }
}

async function lastSessions() {
    try {
        const res = await fetch("/API/training/lastsessions")
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        const sessions = data.sessions
        const rows = document.querySelector("#last-sessions-js-container")
        sessions.forEach(session => {
            const div = document.createElement('div')
            div.classList.add('tableRow')
            div.innerHTML = `
            <div class="rowItem">${session.name}</div>
            <div class="rowItem">${session.date}</div>`
            div.setAttribute('data-session', session)
            // div.setAttribute('data-id', session.id)
            // div.setAttribute('exercises', session.exercises)
            rows.appendChild(div)
            // div.addEventListener('click', () => {

            // })
            // DOKONCZYC
        })
        
    }
    catch (err) {
        console.log(`Error - ${err}`)
    }
}

const setGoal = document.querySelector(".setGoal")
const overlay = document.querySelector(".overlay")
document.querySelectorAll(".addGoal").forEach(button => {
    button.addEventListener("click", () => {
        setGoal.classList.remove('not-visible')
        overlay.classList.remove('not-visible')
        overlay.addEventListener("click", () => {
            overlay.classList.add('not-visible')
            setGoal.classList.add('not-visible')
        })
    })
})

document.querySelector("#saveGoal").addEventListener('click', async () => {
    const goalInput = document.querySelector("#setGoal")
    if (goalInput.value === '' || !goalInput.value) return
    try {
        const res = await fetch('/API/training/goals', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                goal: goalInput.value
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        location.reload()
    }
    catch (err) {
        console.log(`Error - ${err}`)
        setGoal.style.border = '1px solid #ef4444'
        setGoal.style.boxShadow = '0 0 4px 4px rgba(239, 68, 68, 0.2)'
    }
})


document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('current-goal-check')) {
        const d = e.target.closest('div')
        const goal_id = e.target.dataset.id
        try {
            const res = await fetch('/API/training/goalDone', {
                method: "POST",
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify({
                    "id": goal_id
                })
            })
            if (!res.ok) {
                throw new Error(res.status)
            }
            d.remove()
            if (document.querySelectorAll('.current-goal-check').length === 0) {
                noGoals.classList.remove('not-visible')
                currentGoals.classList.add('not-visible')
            }
        } 
        catch (err) {
            console.log(err)
        }
    }
})



const trainingAdder = document.querySelector(".training-adder")



const nextButton = document.querySelector("#next")
const previousButton = document.querySelector("#previous")
const removeButton = document.querySelector("#remove")
const saveButton = document.querySelector("#save")
const exercise = document.querySelector("#exercise")
const sets = document.querySelector("#sets")
const reps = document.querySelector("#reps")
const breaks = document.querySelector("#breaks")

let now = 0;
let values = {};

nextButton.addEventListener('click', () => {
    now++

    if (now === 1) {
        const trainingName = document.querySelector("#trainingName").value
        values['trainingName'] = trainingName
        document.querySelector(".training-name").classList.add('not-visible')
        document.querySelector(".training-exercise").classList.remove('not-visible')
        previousButton.classList.remove('not-visible')
        removeButton.classList.remove('not-visible')
        nextButton.setAttribute('data-i18n', 'training:add')
        updateContent()
        return
    }

    if (exercise.value === '' || sets.value === '' || reps.value === '') {
        now--
        return
    }

    values[now - 1] = {
        exercise: exercise.value,
        sets: sets.value,
        reps: reps.value,
        breaks: breaks.value
    }

    if (now > 2) {
        saveButton.classList.remove('not-visible')
    }

    if (values[now]) {
        exercise.value = values[now].exercise
        sets.value = values[now].sets
        reps.value = values[now].reps
        breaks.value = values[now].breaks
    } else {
        exercise.value = ''
        sets.value = ''
        reps.value = ''
        breaks.value = ''
    }

})

previousButton.addEventListener('click', () => { 
    if (now >= 2 && exercise.value !== '' && sets.value !== '' && reps.value !== '') {
        values[now] = {
            exercise: exercise.value,
            sets: sets.value,
            reps: reps.value,
            breaks: breaks.value
        }
    }

    now--

    if (now <= 0) {
        now = 0
        nextButton.setAttribute('data-i18n', 'training:next')
        updateContent()
        previousButton.classList.add('not-visible')
        removeButton.classList.add('not-visible')
        saveButton.classList.add('not-visible')
        document.querySelector(".training-name").classList.remove('not-visible')
        document.querySelector(".training-exercise").classList.add('not-visible')
    } else {
        if (now <= 1) {
            saveButton.classList.add('not-visible')
        }
        exercise.value = values[now].exercise
        sets.value = values[now].sets
        reps.value = values[now].reps
        breaks.value = values[now].breaks
    }
})

removeButton.addEventListener('click', () => {
    delete values[now]
    exercise.value = ''
    sets.value = ''
    reps.value = ''
    breaks.value = ''
})

saveButton.addEventListener('click', async () => {
    if (Object.keys(values).length < 2) return
    try {
        const res = await fetch('/API/training/newsession', {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                values: values
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        location.reload()
    }
    catch (err) {
        console.log(`Error - ${err}`)
        trainingAdder.style.border = '1px solid #ef4444'
        trainingAdder.style.boxShadow = '0 0 4px 4px rgba(239, 68, 68, 0.2)'
    }
})

document.querySelector(".exit-adder").addEventListener('click', () => {
    now = 0
    overlay.classList.add('not-visible')
    trainingAdder.classList.add('not-visible')
})

overlay.addEventListener("click", () => {
    overlay.classList.add('not-visible')
    trainingAdder.classList.add('not-visible')
})

document.querySelector(".createWorkout button").addEventListener('click', () => {
    now = 0
    values = {}

    document.querySelector(".training-name").classList.remove('not-visible')
    document.querySelector(".training-name input").value = ''
    document.querySelector(".training-exercise").classList.add('not-visible')
    document.querySelectorAll(".training-exercise input").forEach(i => i.value = '')

    previousButton.classList.add('not-visible')
    removeButton.classList.add('not-visible')
    saveButton.classList.add('not-visible')
    nextButton.setAttribute('data-i18n', 'training:next')
    updateContent()

    trainingAdder.classList.remove('not-visible')
    overlay.classList.remove('not-visible')
})

startWorkout.addEventListener("click", () => {
    const training_name_header = document.querySelector("#training_name")
    const exercise_name_header = document.querySelector("#exercise_name")
    const exercise_breaks_input = document.querySelector("#ongoing-breaks")

    const training = JSON.parse(startWorkout.getAttribute('data-training'))
    console.log(training)
    document.querySelector("#training_ongoing").classList.remove('not-visible')
    document.querySelector("#todays-workout").classList.add('not-visible')
    document.querySelector("#middle-section").classList.add('not-visible')
    
    
    let current_exercise = 1

    training_name_header.textContent = training.name
    exercise_name_header.textContent = training.exercises[current_exercise.toString()].exercise
    exercise_breaks_input.value = training.exercises[current_exercise.toString()].breaks
})