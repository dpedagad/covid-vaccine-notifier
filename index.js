const fetch = require('node-fetch')

const prompts = require('prompts');

const statesArr = [];
const districtsArr = [];
const questions = [

    {
        type: 'select',
        name: 'Options',
        message: 'Do you want to fetch by state and district or pincode?',
        choices: [
            { title: 'State and District', description: 'Select this option, if you are not in a city', value: 'State and District' },
            { title: 'Pincode', value: 'Pincode' },],
    },

    {
        type: prev => prev == 'State and District' ? 'select' : 'number',
        name: prev => prev == 'State and District' ? 'State' : 'Pincode',
        message: prev => prev == 'State and District' ? 'Select State' : 'Enter Pincode',
        choices: prev => prev == 'State and District' ? fetchStates() : null,
    },
    {
        type: prev => prev < 40 ? 'select' : null,
        name: prev => prev < 40 ? 'District' : null,
        message: prev => prev < 40 ? 'Select a district' : null,
        choices: prev => prev < 40 ? fetchDistricts(prev) : null
    },
    {
        type: 'number',
        name: 'Age',
        message: 'Enter age',
        validate: value => value < 18 ? `Sorry, you have to be 18` : true
    },
    {
        type: 'select',
        name: 'Vaccine',
        message: 'Select Vaccine',
        choices: [
            { title: 'COVISHIELD', value: 'COVISHIELD' },
            { title: 'COVAXIN', value: 'COVAXIN' },
            { title: 'SPUTNIK V', description: 'This vaccine may not be available in your location', value: 'SPUTNIK V' }
        ]
    },
    {
        type: 'select',
        name: 'Dose',
        message: 'Select Dose',
        choices: [
            { title: '1st', value: '1' },
            { title: '2nd', value: '2' }
        ]
    },
    {
        type: 'select',
        name: 'Payment',
        message: 'Select payment type',
        choices: [
            { title: 'Free', value: 'Free' },
            { title: 'Paid', value: 'Paid' }
        ]
    },
    {
        type: 'date',
        name: 'Date',
        message: 'Choose a future date (If need to check on same date, then choose future time)',
        validate: date => date < Date.now() ? 'Please enter a valid future date' : true
    }

];

async function fetchStates() {

    await fetch('https://cdn-api.co-vin.in/api/v2/admin/location/states', {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    })
        .then(response => response.json())
        .then((res) => {

            for (s in res.states) {
                statesArr.push({
                    title: res.states[s].state_name,
                    value: res.states[s].state_id
                });
            }
        })
    return statesArr
}

async function fetchDistricts(stateID) {

    await fetch('https://cdn-api.co-vin.in/api/v2/admin/location/districts/' + stateID, {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    })
        .then(response => response.json())
        .then((res) => {

            for (d in res.districts) {
                districtsArr.push({
                    title: res.districts[d].district_name,
                    value: res.districts[d].district_id
                });
            }
        })
    return districtsArr
}


function minimumAge(age) {
    if (age < 45) {
        return 18
    } else {
        return 45
    }
}

function checkAvailabilityByDistrictID(dID, date, age, vaccine, dose, payment) {
    return fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=' + dID + '&date=' + date, {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    }).then(response => response.json())
        .then((res) => {
            flag = false;

            if (res.centers.length != 0) {
                const min_age = minimumAge(age)
                for (c in res.centers) {
                    for (s in res.centers[c].sessions) {
                        if (dose == 1) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose1 > 0) {
                                console.log("1st dose", res.centers[c].sessions[s].vaccine, "vaccines are available at", res.centers[c].name, "with capacity", res.centers[c].sessions[s].available_capacity_dose1, "on date", res.centers[c].sessions[s].date)
                                flag = true
                            }


                        } else if (dose == 2) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose2 > 0) {
                                console.log("2nd dose", res.centers[c].sessions[s].vaccine, "vaccines are available at", res.centers[c].name, "with capacity", res.centers[c].sessions[s].available_capacity_dose2, "on date", res.centers[c].sessions[s].date)
                                flag = true
                            }

                        }


                    }
                }
                if (!flag) {
                    console.log("Sorry, there are no slots available for the given input")
                }
            } else {
                console.log("Slots are not updated for the date", date, "Please try with an earlier date or time")
            }
        })
        .catch(err => console.log(err));
}

function checkAvailabilityByPincode(pin, date, age, vaccine, dose, payment) {
    return fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=' + pin + '&date=' + date, {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    }).then(response => response.json())
        .then((res) => {
            console.log("res is", res)
            flag = false;
            if (res.centers.length != 0) {
                const min_age = minimumAge(age)
                for (c in res.centers) {
                    for (s in res.centers[c].sessions) {
                        if (dose == 1) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose1 > 0) {
                                console.log("1st dose", res.centers[c].sessions[s].vaccine, "vaccines are available at", res.centers[c].name, "in the given pincode on date", res.centers[c].sessions[s].date, "with capacity", res.centers[c].sessions[s].available_capacity_dose1)
                                res.centers[c].sessions[s].available_capacity
                                flag = true
                            }

                        } else if (dose == 2) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose2 > 0) {
                                console.log("2nd dose", res.centers[c].sessions[s].vaccine, "vaccines are available at", res.centers[c].name, "in the given pincode on date", res.centers[c].sessions[s].date, "with capacity", res.centers[c].sessions[s].available_capacity_dose2)
                                res.centers[c].sessions[s].available_capacity
                                flag = true
                            }

                        }

                    }
                }
                if (!flag) {
                    console.log("Sorry, there are no slots available for the given input")
                }
            } else {
                console.log("Slots are not updated for the date", date)
            }
        })
        .catch(err => console.log(err));
}


(() => {
    const onSubmit = (prompt, answer) => console.log(`Thanks we got ${answer} from ${prompt.name}`);
    return prompts(questions, { onSubmit });
})().then((res) => {
    const date = res.Date.toLocaleDateString();

    if (res.fetch_using == 'Pincode') {
        checkAvailabilityByPincode(res.Pincode, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        setInterval(() => { checkAvailabilityByPincode(res.Pincode, date, res.Age, res.Vaccine, res.Dose, res.Payment) }, 5000)
    } else {
        checkAvailabilityByDistrictID(res.District, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        setInterval(() => { checkAvailabilityByDistrictID(res.District, date, res.Age, res.Vaccine, res.Dose, res.Payment) }, 5000)
    }
});

