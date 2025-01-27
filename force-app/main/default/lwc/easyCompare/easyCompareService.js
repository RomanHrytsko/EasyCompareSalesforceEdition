export default class EasyCompareService {

    /**
     * @param cmp {EasyCompare} component instance
     */

    constructor(cmp) {
        this.cmp = cmp;
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
}