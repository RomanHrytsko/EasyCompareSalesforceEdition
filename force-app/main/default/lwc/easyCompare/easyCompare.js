import { LightningElement } from 'lwc';
import compareRecords from '@salesforce/apex/EasyCompareController.compareRecords';

export default class EasyCompare extends LightningElement {
    leftInput;
    rightInput;
    result;
    error;

    startCompare() {
        this.leftInput = this.template.querySelector('.left-input');
        this.rightInput = this.template.querySelector('.right-input');

        this.compareRecords();
    }

    async compareRecords() {
        try {
            this.result = await compareRecords({ recordId1: this.leftInput.value, recordId2: this.rightInput.value });
            this.error = undefined;
        } catch (error) {
            this.error = error;
            this.result = undefined;
        }
    }
}