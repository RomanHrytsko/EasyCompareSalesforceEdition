import validateObjectAPINames from '@salesforce/apex/EasyCompareController.validateObjectAPINames';
import compareRecords from '@salesforce/apex/EasyCompareController.compareRecords';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

export default class EasyCompareService {

    /**
     * @param cmp {EasyCompare} component instance
     */

    constructor(cmp) {
        this.cmp = cmp;
    }

    startComparison() {
        this.cmp.leftInput = this.cmp.template.querySelector('.left-input');
        this.cmp.rightInput = this.cmp.template.querySelector('.right-input');

        if(this.runValidations()) {
            this.compareRecords();
        }
    }

    async compareRecords() {
        try {
            const comparisonResult = await compareRecords(
                {
                    recordId1: this.cmp.leftInput.value,
                    recordId2: this.cmp.rightInput.value
                }
            );

            this.cmp.leftColumnResult = comparisonResult[0][this.cmp.leftInput.value];
            this.cmp.rightColumnResult = comparisonResult[1][this.cmp.rightInput.value];

            this.cmp.columnsContainers = [...this.cmp.template.querySelectorAll('.scrollable')]
            this.clearDataInColumns();
            this.alignFieldsAndValues();

            this.generateValuesForTheColumn(this.cmp.leftColumnResult, this.cmp.CONSTANTS.COLUMN_SIDES.LEFT);
            this.generateValuesForTheColumn(this.cmp.rightColumnResult, this.cmp.CONSTANTS.COLUMN_SIDES.RIGHT);

            this.error = undefined;

        } catch (error) {
            this.showToast(this.cmp.CONSTANTS.ERROR, error, 'error');
        }
    }

    generateValuesForTheColumn(comparisonResult, columnSide){
        try{
            let column;

            if (columnSide === this.cmp.CONSTANTS.COLUMN_SIDES.LEFT) {
                column = this.cmp.template.querySelector('.left-column-container')

            } else if (columnSide === this.cmp.CONSTANTS.COLUMN_SIDES.RIGHT) {
                column = this.cmp.template.querySelector('.right-column-container')
            }

            for(const [key, value] of Object.entries(comparisonResult)) {
                const classesToAdd = [
                    'block',
                    'slds-p-left_small',
                    'slds-p-vertical_small',
                    key
                ];

                const div = document.createElement('div');

                div.classList.add(...classesToAdd);

                const stringValue = JSON.stringify(value)

                div.innerHTML = `<b>${key}</b>: ${stringValue} \n`;

                div.addEventListener('mouseover', this.highlightFieldOnHover);
                div.addEventListener('mouseout', this.removeHighlightedStyle);

                column.appendChild(div);
            }

        } catch(error) {
            this.showToast(this.cmp.CONSTANTS.ERROR, error, 'error');
        }
    }

    scrollThroughColumn(element) {
        const scrolledElem = element.target;
        if (!this.cmp.stopScrolling) {
            this.cmp.stopScrolling = true;

            this.cmp.columnsContainers.filter((item) => item !== scrolledElem).forEach((elem) => {
                elem.removeEventListener('scroll', this.scrollThroughColumn);
                this.syncScroll(scrolledElem, elem);
                setTimeout(() => {
                    elem.addEventListener('scroll', this.scrollThroughColumn);
                    this.cmp.stopScrolling = false;
                }, 0);
            });
        }
    }

    syncScroll(scrolledElem, elem) {
        const scrolledPercent = scrolledElem.scrollTop / (scrolledElem.scrollHeight - scrolledElem.clientHeight);
        const top = scrolledPercent * (elem.scrollHeight - elem.clientHeight);

        const scrolledWidthPercent = scrolledElem.scrollLeft / (scrolledElem.scrollWidth - scrolledElem.clientWidth);
        const left = scrolledWidthPercent * (elem.scrollWidth - elem.clientWidth);

        elem.scrollTop = top;
        elem.scrollLeft = left;
    }

    clearDataInColumns() {
        this.cmp.columnsContainers.forEach(column => {
            while (column.lastElementChild) {
                column.removeChild(column.lastElementChild);
            }
        })
    }

    alignFieldsAndValues(){
        for (const [key] of Object.entries(this.cmp.leftColumnResult)) {
            if (!this.cmp.rightColumnResult.hasOwnProperty(key)) {
                this.cmp.rightColumnResult[key] = this.cmp.CONSTANTS.EMPTY_VALUE;
            }
        }

        for (const [key] of Object.entries(this.cmp.rightColumnResult)) {
            if (!this.cmp.leftColumnResult.hasOwnProperty(key)) {
                this.cmp.leftColumnResult[key] = this.cmp.CONSTANTS.EMPTY_VALUE;
            }
        }

        this.cmp.leftColumnResult = this.sortResultsInAlphabeticalOrder(this.cmp.leftColumnResult)
        this.cmp.rightColumnResult = this.sortResultsInAlphabeticalOrder(this.cmp.rightColumnResult)
    }

    highlightFieldOnHover(event) {
        this.service.getRowBlocks(event).forEach(row => {
            row.style.backgroundColor = '#ffcc00';
            row.style.borderRadius = '6px';
        })
    }

    removeHighlightedStyle(event) {
        this.service.getRowBlocks(event).forEach((row) => {
            row.style.backgroundColor = '';
            row.style.borderRadius = '0';
        })
    }

    sortResultsInAlphabeticalOrder(unordered) {
        return Object.keys(unordered).sort().reduce(
            (obj, key) => {
                obj[key] = unordered[key];
                return obj;
            },
            {}
        );
    }

    extractFieldAPIName(inputString) {
        const regex = /<b>(.*?)<\/b>/g;
        const matches = [];
        let match;

        while ((match = regex.exec(inputString)) !== null) {
            matches.push(match[1]);
        }

        return matches[0];
    }

    getRowBlocks(event) {
        const targetElement = event.target;

        if (targetElement && targetElement.classList) {
            const fieldAPIName = '.' + this.extractFieldAPIName(targetElement.innerHTML);
            return this.cmp.template.querySelectorAll(fieldAPIName);
        }

        return [];
    }

    async runValidations() {
        this.cmp.validationPassed = true;
        this.validateRecordIds()

        if (this.cmp.validationPassed) {
            await this.validateObjectAPINames();

        } else if (!this.cmp.validationPassed) {
            this.showToast(this.cmp.CONSTANTS.ERROR, this.cmp.errorMessage, 'error');
        }

        return this.cmp.validationPassed;
    }

    async validateObjectAPINames() {
        this.cmp.validationPassed = await validateObjectAPINames(
            {recordId1: this.cmp.leftInput.value, recordId2: this.cmp.rightInput.value}
        );
        this.checkValidationResult();
    }

    checkValidationResult() {
        try {
            if (!this.cmp.validationPassed) {
                this.cmp.errorMessage = this.cmp.CONSTANTS.ERROR_MESSAGES.DIFFERENT_OBJECTS;
            }

        } catch (error) {
            this.cmp.error = error;
            this.showToast(this.cmp.CONSTANTS.ERROR, error, 'error');
            this.cmp.validationPassed = false;
        }
    }

    validateRecordIds() {
        const recordIdPattern = /^[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}$/;
        const isRecordId1Valid = recordIdPattern.test(this.cmp.leftInput.value);
        const isRecordId2Valid = recordIdPattern.test(this.cmp.rightInput.value);

        if (!isRecordId1Valid || !isRecordId2Valid) {
            this.cmp.errorMessage = this.cmp.CONSTANTS.ERROR_MESSAGES.INVALID_RECORD_ID;
            this.cmp.validationPassed = false;
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant

        });
        this.cmp.dispatchEvent(event);
    }
}