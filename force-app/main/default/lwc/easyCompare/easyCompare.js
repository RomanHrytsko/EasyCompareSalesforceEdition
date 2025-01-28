import { LightningElement, track } from 'lwc';
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

    handleComparison() {
        this.service.startComparison();
    }

    handleScroll(element) {
        this.service.scrollThroughColumn(element)
    }
}
