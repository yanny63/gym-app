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

function displayButtons(bool) {
    if (bool) {
        document.querySelector(".seeWorkoutInfo").classList.remove('not-visible')
        document.querySelector(".startWorkout").classList.add('not-visible')
    }
    else {
        document.querySelector(".seeWorkoutInfo").classList.add('not-visible')
        document.querySelector(".startWorkout").classList.remove('not-visible')
    }
}

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
            if (res.status === 404) {
                document.querySelector(".loader").classList.add("not-visible")
                document.querySelector(".training-article").classList.remove("not-visible")
            }
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
                div1.innerText = exercise.name
                div2.innerText = exercise.sets.length
                div3.innerText = exercise.sets[0].reps
                
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

        displayButtons(session?.data ?? false)

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

function closeGoal() {
    overlay.classList.add('not-visible')
    setGoal.classList.add('not-visible')
}

const setGoal = document.querySelector(".setGoal")
const overlay = document.querySelector(".overlay")
document.querySelectorAll(".addGoal").forEach(button => {
    button.addEventListener("click", () => {
        setGoal.classList.remove('not-visible')
        overlay.classList.remove('not-visible')
        overlay.addEventListener("click", closeGoal, {once: true})
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
    const exercises = Object.entries(values)
    .filter(([key]) => key !== 'trainingName')
    .map(([, v]) => ({
        name: v.exercise,
        sets: Array.from({ length: parseInt(v.sets) }, () => ({ 
            reps: v.reps, 
            weight: "", 
            break: v.breaks 
        }))
    }))
    try {
        const res = await fetch('/API/training/newsession', {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: values.trainingName,
                exercises: exercises
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

function hideAdder() {
    overlay.classList.add('not-visible')
    trainingAdder.classList.add('not-visible')
}
overlay.addEventListener("click", hideAdder, {once: true})

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

let current_exercise = 0
let current_set = 0
let training
const current_workout_values = {}

const next_exercise = document.querySelector("#ongoing_next") // BUTTON 
const ongoing_set_input = document.querySelector("#ongoing_sets") // INPUT
const exercise_name_header = document.querySelector("#exercise_name") // HEADER
const training_name_header = document.querySelector("#training_name") // HEADER
const exercise_breaks_input = document.querySelector("#ongoing-breaks") // INPUT
const exercise_reps_input = document.querySelector("#ongoing_reps") // INPUT
const exercise_weight_input = document.querySelector("#ongoing_weight") // INPUT
const previous_exercise = document.querySelector("#ongoing_previous") // BUTTON
const end_workout = document.querySelector("#ongoing_end") // BUTTON

async function sendData(values) {
    const workout = values.workout_name
    const exercises = values.exercises
    try {
        const res = await fetch('', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                workout: workout,            
                exercises: exercises
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        await todaysSession()
    }
    catch (err) {
        console.log(`Error - ${err}`)
    }
}

startWorkout.addEventListener("click", () => {
    training = JSON.parse(startWorkout.getAttribute('data-training'))
    
    document.querySelector("#training_ongoing").classList.remove('not-visible')
    document.querySelector("#todays-workout").classList.add('not-visible')
    document.querySelector("#middle-section").classList.add('not-visible')
    
    
    current_workout_values['workout_name'] = training.name
    current_workout_values['exercises'] = Array.from({ length: parseInt(training.exercises.length) }, () => ({
        name: "",
        sets: []
    }))
    
    training_name_header.textContent = training.name
    exercise_name_header.textContent = training.exercises[0].name
    exercise_weight_input.value = training.exercises[0].sets[0].weight
    exercise_reps_input.value = training.exercises[0].sets[0].reps
    exercise_breaks_input.value = training.exercises[0].sets[0].break
})

function loadSetValues(exercise, set) {
    const saved = current_workout_values['exercises'][exercise]?.sets[set]
    const template = training.exercises[exercise].sets[set]
    exercise_weight_input.value = saved?.weight ?? template.weight
    exercise_reps_input.value = saved?.reps ?? template.reps
    exercise_breaks_input.value = saved?.break ?? template.break
}

next_exercise.addEventListener("click", async () => {
    if (previous_exercise.classList.contains('not-visible')) {
        previous_exercise.classList.remove('not-visible')
    }
    training = JSON.parse(startWorkout.getAttribute('data-training'))
    if (!current_workout_values['exercises'][current_exercise].name) {
        current_workout_values['exercises'][current_exercise].name = exercise_name_header.textContent
    }
    current_workout_values['exercises'][current_exercise].sets[current_set] = {
        break: exercise_breaks_input.value,
        reps: exercise_reps_input.value,
        weight: exercise_weight_input.value
    }
    current_set++
    if (current_set > training['exercises'][current_exercise]['sets'].length - 1) {
        current_set = 0
        current_exercise++
        if (current_exercise > training['exercises'].length - 1) {
            document.querySelector(".ongoing-training-div-container").classList.add('not-visible')
            document.querySelector(".workout-done").classList.remove('not-visible')
            document.querySelector(".isDone").innerHTML = `
                <svg viewBox="0 0 100 100" width="120">
                    <circle cx="50" cy="50" r="40"
                        fill="none" stroke="#22c55e"
                        stroke-width="4"
                        stroke-dasharray="251"
                        stroke-dashoffset="251"
                        stroke-linecap="round">
                        <animate attributeName="stroke-dashoffset" from="251" to="0" dur="0.6s" fill="freeze" begin="0s"/>
                    </circle>
                    <path d="M28 50 L43 65 L72 35"
                        fill="none" stroke="#22c55e"
                        stroke-width="5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-dasharray="60"
                        stroke-dashoffset="60">
                        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.4s" fill="freeze" begin="0.6s"/>
                    </path>
                </svg>`
            await sendData(current_workout_values)
            return
        }
        exercise_name_header.textContent = training.exercises[current_exercise].name
        loadSetValues(current_exercise, current_set)
    }
    else {
        loadSetValues(current_exercise, current_set)
    }
    console.log(current_workout_values)
})

previous_exercise.addEventListener('click', () => {
    current_workout_values['exercises'][current_exercise].sets[current_set] = {
        break: exercise_breaks_input.value,
        reps: exercise_reps_input.value,
        weight: exercise_weight_input.value
    }
    if (current_set === 0) {
        current_exercise--
        current_set = training['exercises'][current_exercise]['sets'].length - 1
    }
    else {
        current_set--
    }
    if (current_set === 0 && current_exercise === 0) {
        previous_exercise.classList.add('not-visible')
    }
    exercise_name_header.textContent = training.exercises[current_exercise].name
    loadSetValues(current_exercise, current_set)
})

function hideEnsuring() {
    overlay.classList.add('not-visible')
    document.querySelector(".ensure").classList.remove('isVisible')
    overlay.removeEventListener('click', hideEnsuring)
}

end_workout.addEventListener('click', () => {
    overlay.removeEventListener('click', closeGoal)
    overlay.removeEventListener('click', hideAdder)
    document.querySelector(".ensure").classList.add('isVisible')
    overlay.classList.remove('not-visible')
    overlay.addEventListener('click', hideEnsuring, {once: true})
})
document.querySelector("#yes").addEventListener('click', async () => {
    await sendData(current_workout_values)
})
document.querySelector("#no").addEventListener('click', () => {
    hideEnsuring()
})