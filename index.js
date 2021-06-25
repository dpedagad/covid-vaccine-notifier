const fetch = require('node-fetch')
const prompts = require('prompts');
const player = require("play-sound")((opts = {}));

const { minimumAge } = require('./utils')

let intervalID = 0;
const questions = [

    {
        type: 'select',
        name: 'Options',
        message: 'Do you want to search by (state and district) or pincode?',
        choices: [
            { title: 'State and District', description: 'Select this option, if you are not in a city', value: 0 },
            { title: 'Pincode', value: 1 },],
    },

    {
        type: prev => prev === 0 ? 'select' : 'number',
        name: prev => prev === 0 ? 'State' : 'Pincode',
        message: prev => prev === 0 ? 'Select State' : 'Enter Pincode',
        choices: prev => prev === 0 ? fetchStates() : null,
        validate: value => value < 100000 ? 'Please enter a valid pincode' : true
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
        message: 'Choose a future date (If need to check on the same date, then choose future time)',
        validate: date => date < Date.now() ? 'Please enter a valid future date' : true
    }

];

const fetchStates = async () => {
    const statesArr = [];
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

const fetchDistricts = async (stateID) => {
    const districtsArr = [];
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



const checkAvailabilityByDistrictID = (dID, date, age, vaccine, dose, payment) => {
    fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=' + dID + '&date=' + date, {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    }).then(response => response.json())
        .then((res) => {
            flag = false;
            mail_body = "";
            if (res.centers.length != 0) {
                const min_age = minimumAge(age)
                for (c in res.centers) {
                    for (s in res.centers[c].sessions) {
                        if (dose == 1) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose1 > 0) {
                                mail_body += "\n" + "1st dose", res.centers[c].sessions[s].vaccine, "vaccines are available at", res.centers[c].name, "with capacity", res.centers[c].sessions[s].available_capacity_dose1, "on date", res.centers[c].sessions[s].date + " from " + res.centers[c].from + " to " + res.centers[c].to
                                flag = true
                            }


                        } else if (dose == 2) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose2 > 0) {
                                mail_body += "\n" + "2nd dose " + res.centers[c].sessions[s].vaccine + " vaccines are available at " + res.centers[c].name + " with capacity " + res.centers[c].sessions[s].available_capacity_dose2 + " on date " + res.centers[c].sessions[s].date + " from " + res.centers[c].from + " to " + res.centers[c].to
                                flag = true
                            }

                        }


                    }


                }
                if (!flag) {
                    mail_body = "Sorry, there are no slots available for the given input. Leave this window to run in the background to get notified"
                } else {
                    clearInterval(intervalID)
                    player.play("./beep.mp3");
                }
            }
            else {
                mail_body = "Slots are not updated for the date " + date + " Please try with an earlier date or time ,or leave this window to run in the background to get notified"
            }
            console.log(mail_body)


        })
        .catch(err => console.log(err));
}

const checkAvailabilityByPincode = (pin, date, age, vaccine, dose, payment) => {
    fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=' + pin + '&date=' + date, {
        method: 'get',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        }
    }).then(response => response.json())
        .then((res) => {
            flag = false;
            mail_body = "";
            if (res.centers.length != 0) {
                const min_age = minimumAge(age)
                for (c in res.centers) {
                    for (s in res.centers[c].sessions) {
                        if (dose == 1) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose1 > 0) {
                                mail_body += "\n" + "1st dose " + res.centers[c].sessions[s].vaccine + " vaccines are available at " + res.centers[c].name + " in the given pincode on date " + res.centers[c].sessions[s].date + " with capacity " + res.centers[c].sessions[s].available_capacity_dose1 + " on date " + res.centers[c].sessions[s].date + " from " + res.centers[c].from + " to " + res.centers[c].to
                                flag = true
                            }

                        } else if (dose == 2) {
                            if (min_age == res.centers[c].sessions[s].min_age_limit && vaccine == res.centers[c].sessions[s].vaccine && payment == res.centers[c].fee_type && res.centers[c].sessions[s].available_capacity_dose2 > 0) {
                                mail_body += "\n" + "2nd dose " + res.centers[c].sessions[s].vaccine + " vaccines are available at " + res.centers[c].name + " in the given pincode on date " + res.centers[c].sessions[s].date + " with capacity " + res.centers[c].sessions[s].available_capacity_dose2 + " on date " + res.centers[c].sessions[s].date + " from " + res.centers[c].from + " to " + res.centers[c].to
                                flag = true
                            }

                        }

                    }
                }
                if (!flag) {
                    mail_body = "Sorry, there are no slots available for the given input. Leave this window to run to run in the background to get notified"

                } else {
                    clearInterval(intervalID)
                    player.play("./beep.mp3");
                }

            } else {
                mail_body = "Slots are not updated for the date " + date + " Please try with an earlier date or time ,or leave this window to run in the background to get notified"

            }
            console.log(mail_body)
        })
        .catch(err => console.log(err));
}

(() => {
    return prompts(questions);
})().then((res) => {
    const date = res.Date.toLocaleDateString();
    if (res.Options == 1) {
        checkAvailabilityByPincode(res.Pincode, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        intervalID = setInterval(() => {
            checkAvailabilityByPincode(res.Pincode, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        }, 60000)
    } else {
        checkAvailabilityByDistrictID(res.District, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        intervalID = setInterval(() => {
            checkAvailabilityByDistrictID(res.District, date, res.Age, res.Vaccine, res.Dose, res.Payment)
        }, 60000)


    }
});