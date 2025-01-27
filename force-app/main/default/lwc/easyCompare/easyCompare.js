import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import compareRecords from '@salesforce/apex/EasyCompareController.compareRecords';
import validateObjectAPINames from '@salesforce/apex/EasyCompareController.validateObjectAPINames';
import Service from './easyCompareService'
import CONSTANTS from './easyCompareConstants'

export default class EasyCompare extends LightningElement {
    @track leftColumnResult;
    @track rightColumnResult;
    leftInput;
    rightInput;
    columnsContainers = [];
    validationPassed = true;
    error;
    errorMessage;
    stopScrolling = false;
    CONSTANTS = CONSTANTS;

    constructor() {
        super();
        this.service = new Service(this);
        this.service.highlightFieldOnHover = this.service.highlightFieldOnHover.bind(this)
        this.service.removeHighlightedStyle = this.service.removeHighlightedStyle.bind(this)

    }

    startCompare() {
        this.leftInput = this.template.querySelector('.left-input');
        this.rightInput = this.template.querySelector('.right-input');

        if(this.runValidations()) {
            this.compareRecords();
        }
    }

    generateValuesForTheColumn(comparisonResult, columnSide){
        let column;

        if(columnSide === this.CONSTANTS.COLUMN_SIDES.LEFT) {
            column = this.template.querySelector('.left-column-container')
        } else if (columnSide === this.CONSTANTS.COLUMN_SIDES.RIGHT) {
            column = this.template.querySelector('.right-column-container')
        }
        try{
            for(const [key, value] of Object.entries(comparisonResult)) {
                const classesToAdd = ['block', 'slds-p-left_small', 'slds-p-vertical_small', key];
                const div = document.createElement('div');

                div.classList.add(...classesToAdd);

                let stringValue = JSON.stringify(value)

                div.innerHTML = `<b>${key}</b>: ${stringValue} \n`;

                div.addEventListener('mouseover', this.service.highlightFieldOnHover);
                div.addEventListener('mouseout', this.service.removeHighlightedStyle);

                column.appendChild(div);
            }
        } catch(error) {
            //add error handling
            console.log(error);
        }
    }

    alignFieldsAndValues(){
        for (const [key] of Object.entries(this.leftColumnResult)) {
            if (!this.rightColumnResult.hasOwnProperty(key)) {
                this.rightColumnResult[key] = this.CONSTANTS.EMPTY_VALUE;
            }
        }

        for (const [key] of Object.entries(this.rightColumnResult)) {
            if (!this.leftColumnResult.hasOwnProperty(key)) {
                this.leftColumnResult[key] = this.CONSTANTS.EMPTY_VALUE;
            }
        }

        this.leftColumnResult = this.sortResultsInAlphabeticalOrder(this.leftColumnResult)
        this.rightColumnResult = this.sortResultsInAlphabeticalOrder(this.rightColumnResult)
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



    handleScroll(element) {
        const scrolledEle = element.target;
        if (!this.stopScrolling) {
            this.stopScrolling = true;

            this.columnsContainers.filter((item) => item !== scrolledEle).forEach((ele) => {
                ele.removeEventListener('scroll', this.handleScroll);
                this.syncScroll(scrolledEle, ele);
                setTimeout(() => {
                    ele.addEventListener('scroll', this.handleScroll);
                    this.stopScrolling = false;
                }, 0);
            });
        }
    }

    syncScroll(scrolledEle, ele) {
        const scrolledPercent = scrolledEle.scrollTop / (scrolledEle.scrollHeight - scrolledEle.clientHeight);
        const top = scrolledPercent * (ele.scrollHeight - ele.clientHeight);
    
        const scrolledWidthPercent = scrolledEle.scrollLeft / (scrolledEle.scrollWidth - scrolledEle.clientWidth);
        const left = scrolledWidthPercent * (ele.scrollWidth - ele.clientWidth);
    
        ele.scrollTop = top;
        ele.scrollLeft = left;
    }

    clearDataInColumns() {
        this.columnsContainers.forEach(column => {
            while (column.lastElementChild) {
                column.removeChild(column.lastElementChild);
            }
        })
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

    async compareRecords() {
        try {
            const comparisonResult = await compareRecords(
                { recordId1: this.leftInput.value, recordId2: this.rightInput.value }
            );
            this.leftColumnResult = comparisonResult[0][this.leftInput.value];
            this.rightColumnResult = comparisonResult[1][this.rightInput.value];

            this.columnsContainers = [...this.template.querySelectorAll('.scrollable')]
            this.clearDataInColumns();
            this.alignFieldsAndValues();

            this.generateValuesForTheColumn(this.leftColumnResult, this.CONSTANTS.COLUMN_SIDES.LEFT);
            this.generateValuesForTheColumn(this.rightColumnResult, this.CONSTANTS.COLUMN_SIDES.RIGHT);
            
            this.error = undefined;
        } catch (error) {
            //handle error
            this.error = error;
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
            
        });
        this.dispatchEvent(event);
    }

    async validateObjectAPINames() {
        try {

            this.validationPassed = await validateObjectAPINames(
                { recordId1: this.leftInput.value, recordId2: this.rightInput.value }
            );

            if(!this.validationPassed) {
                this.errorMessage = this.CONSTANTS.ERROR_MESSAGES.DIFFERENT_OBJECTS;
            }

            return this.validationPassed;

        } catch (error) {
            //handle error message
            this.error = error;
            // this.errorMessage = rightTextAreaValue
            this.validationPassed = false;
        }
    }

    validateRecordIds() {
        const recordIdPattern = /^[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}$/;
        const isRecordId1Valid = recordIdPattern.test(this.leftInput.value);
        const isRecordId2Valid = recordIdPattern.test(this.rightInput.value);

        if (!isRecordId1Valid || !isRecordId2Valid) {
            this.errorMessage = this.CONSTANTS.ERROR_MESSAGES.INVALID_RECORD_ID;
            this.validationPassed = false;
        }

        return this.validationPassed;
    }

    
    async runValidations() {
        this.validationPassed = true;
        if (this.validateRecordIds()) {
            await this.validateObjectAPINames();
        }

        if (!this.validationPassed) {
            this.showToast('Error', this.errorMessage, 'error');
        }

        return this.validationPassed;
    }
}