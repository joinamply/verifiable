// let inputEnrollment;
let inputProviders = $('[calculator-field="providers"]');
let inputDelegatedPercentage = $('[calculator-field="delegated-percentage"]');
let inputOutsourcedEventsPercent = $('[calculator-field="outsourced-events-percent"]');
let inputCredentialingModel = $('[calculator-field="credentialing-model"]');

let providersParsed;
let delegatedPercentageParsed;
let outsourcedEventsPercentParsed;

let eventsYear,
    eventsFte,
    inhouseFtes,
    minutesEvent,
    annualCompensation,
    outsourcedEventsSavings;
// let resultSavingsMember; 

let displayMinutesEvent = $('[calculator-result="minutes-event"]');
let displayAnnualCompensation = $('[calculator-result="annual-compensation"]');
let displayOutsourcedEventsSavings = $('[calculator-result="outsourced-events-savings"]');

let isInitialized = false;

/* Grabs the internal value and set as the input val */
$("input").on("focus", function () {
    $(this).val($(this).attr('int-value'));
});

/* Controls the allowed keys for each kind of input */
$("input").on("keydown", function (event) {
    /* Check if the pressed key is Enter (key code 13) */
    if (event.keyCode === 13) {
        /* Blur the input field when Enter is pressed */
        $(this).blur();
        return;
    }
    switch ($(this).attr("display-type")) {
        case "percentage" || "currency":
            /* Allow: backspace, delete, tab, escape, and enter */
            if ($.inArray(event.keyCode, [46, 8, 9, 27, 13]) !== -1 ||
                /* Allow: Ctrl+A */
                (event.keyCode == 65 && (event.ctrlKey === true || event.metaKey === true)) ||
                /* Allow: Ctrl+C */
                (event.keyCode == 67 && (event.ctrlKey === true || event.metaKey === true)) ||
                /* Allow: Ctrl+X */
                (event.keyCode == 88 && (event.ctrlKey === true || event.metaKey === true)) ||
                /* Allow: home, end, left, right */
                (event.keyCode >= 35 && event.keyCode <= 39)) {
                /* Let it happen, don't do anything */
                return;
            }
            /* Ensure that it is a number and stop the keypress */
            if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
                (event.keyCode < 96 || event.keyCode > 105)) {
                event.preventDefault();
            }
            break;
    }
});

/* Check if the content that is being pasted is supported by the input */
$("input").on("paste", function (event) {
    switch ($(this).attr("display-type")) {
        case "percentage" || "currency":
            /* Get the pasted text */
            let _pastedText = event.originalEvent.clipboardData.getData('text');
            /* Remove non-numeric characters */
            var _cleanedText = _pastedText.replace(/[^0-9]/g, '');
            /* Update the input value with the cleaned text */
            $(this).val(_cleanedText);
            /* Prevent the default paste behavior */
            event.preventDefault();
            break;
    }
});

/* On blur gets the internal value and format it to display as the input value */
$("input").on("blur", function () {
    /* First check if the input has a value val and if not reset to default */
    if ($(this).val() == "") { $(this).val($(this).attr("default-value")); }
    /* Save the val */
    $(this).attr('int-value', $(this).val());
    /* Format and update the input val */
    switch ($(this).attr("display-type")) {
        case "percentage":
            $(this).val(formatPercentage($(this).val()));
            break;
        case "currency":
            $(this).val(formatCurrency($(this).val()));
            break;
    }
    if (isInitialized) {
        runCalculations();
    }
});

$("select").on("change", function () {
    runCalculations();
});

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(num);
}

function formatPercentage(num) {
    return Math.floor(num) + "%";
}

function formatNumber(num, round = true) {
    let _num = parseFloat(num);
    if (round) {
        _num = Math.round(_num);
    }
    return _num.toLocaleString("en-US");
}

function parseValues() {
    providersParsed = parseFloat(inputProviders.attr('int-value'));
    delegatedPercentageParsed = parseFloat(inputDelegatedPercentage.attr('int-value'));
    outsourcedEventsPercentParsed = parseFloat(inputOutsourcedEventsPercent.attr('int-value'));
}

function runCalculations() {
    parseValues();
    // Events per year
    eventsYear = (providersParsed / 3 + providersParsed * 0.15) * (1 - (delegatedPercentageParsed / 100));
    // Events per FTE
    switch (inputCredentialingModel.val()) {
        case 'inManual':
            eventsFte = 40;
            break;
        case 'inAutomated':
            eventsFte = 60;
            break;
        case 'outsourced':
            eventsFte = 225;
            break;
    }
    // In-house FTEs
    inhouseFtes = eventsYear / 12 / eventsFte;
    // Minutes per event
    if (providersParsed == 0 && delegatedPercentageParsed == 0 && outsourcedEventsPercentParsed == 0) {
        minutesEvent = 0;
    }
    else {
        switch (inputCredentialingModel.val()) {
            case 'inManual':
                minutesEvent = 79;
                break;
            case 'inAutomated':
                minutesEvent = 39;
                break;
            case 'outsourced':
                minutesEvent = 'N/A';
                break;
        }
    }
    // Annual Compensation Equivalent Saved
    switch (inputCredentialingModel.val()) {
        case 'inManual':
            annualCompensation = (75000 / (52 * 40) * minutesEvent / eventsFte * eventsYear);
            break;
        case 'inAutomated':
            annualCompensation = (75000 / (52 * 40) * minutesEvent / eventsFte * eventsYear);
            break;
        case 'outsourced':
            annualCompensation = 0;
            break;
    }
    // Savings from Switching Outsourced Credentialing Events to In-House
    switch (inputCredentialingModel.val()) {
        case 'inManual':
            outsourcedEventsSavings = 0;
            break;
        case 'inAutomated':
            outsourcedEventsSavings = 0;
            break;
        case 'outsourced':
            outsourcedEventsSavings = (((outsourcedEventsPercentParsed / 100) * eventsYear) * (60 - (75000 * inhouseFtes / eventsYear)));
            break;
    }
    if (isNaN(outsourcedEventsSavings)) {
        outsourcedEventsSavings = 0;
    }
    displayResults();
}

function displayResults() {
    displayMinutesEvent.text(minutesEvent);
    displayAnnualCompensation.text(formatCurrency(annualCompensation));
    displayOutsourcedEventsSavings.text(formatCurrency(outsourcedEventsSavings));
}

function init() {
    // inputEnrollment.val(500000);
    inputProviders.val(35000);
    inputDelegatedPercentage.val(30);
    inputOutsourcedEventsPercent.val(50);
    inputCredentialingModel
    /* Force a blur on all inputs */
    $("input").trigger("blur");
    runCalculations();
    isInitialized = true;
}

init();