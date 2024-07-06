import { LightningElement, track } from 'lwc';
import compareRecords from '@salesforce/apex/EasyCompareController.compareRecords';

export default class EasyCompare extends LightningElement {
    leftInput;
    @track leftColumnResult;
    @track rightColumnResult;
    leftTextAreaValue = '';
    rightTextAreaValue = '';
    rightInput;
    result;
    error;

    startCompare() {
        this.leftInput = this.template.querySelector('.left-input');
        this.rightInput = this.template.querySelector('.right-input');

        this.compareRecords();
    }

    generateValuesForTheColumn(comparisonResult){
       let textAreaValue = '';

        try{
            for(const [key, value] of Object.entries(comparisonResult)) {
                let stringValue = JSON.stringify(value)
                textAreaValue += `${key}: ${stringValue} \n`
            }
        } catch(error) {
            console.log(error);
        }

        return textAreaValue;
    }

    async compareRecords() {
        try {
            this.result = await compareRecords({ recordId1: this.leftInput.value, recordId2: this.rightInput.value });
            this.leftColumnResult = this.result[0][this.leftInput.value];
            this.rightColumnResult = this.result[1][this.rightInput.value];

            this.leftTextAreaValue = this.generateValuesForTheColumn(this.leftColumnResult);
            this.rightTextAreaValue = this.generateValuesForTheColumn(this.rightColumnResult);
            
            this.error = undefined;
        } catch (error) {
            this.error = error;
            this.result = undefined;
        }
    }
}