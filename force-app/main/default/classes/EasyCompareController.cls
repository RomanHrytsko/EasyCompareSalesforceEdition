public with sharing class EasyCompareController {
    public EasyCompareController() {}
    
    @AuraEnabled
    public static List<Map<Id, Map<String, Object>>> compareRecords(String recordId1, String recordId2) {
        List<String> recordIds = new List<String>{recordId1, recordId2};
        String record1ApiName = getObjectApiNameFromId(recordId1);
        String record2ApiName = getObjectApiNameFromId(recordId2);
        Map<Id, Map<String, Object>> recordFieldsAndValues = new Map<Id, Map<String, Object>>();

        if(record1ApiName == record2ApiName) {
            //can be 100, 200, 300 or maximum fields allowed per object
            List<String> sobjectFieldsAPINames = getSObjectFieldsAPINames(getSObjectFieldNames(recordId1));
            List<String> fieldsToQuery = new List<String>();

            String query = 'SELECT ' + String.join(sobjectFieldsAPINames, ', ') +  ' FROM ' + record1ApiName + ' WHERE Id IN :recordIds';
            List<SObject> recordsToCompare = Database.query(query);
            
            recordFieldsAndValues.putAll(combineFields(recordsToCompare, sobjectFieldsAPINames));
            return compareRecordFieldValuesAndFindDifferent(recordFieldsAndValues, sobjectFieldsAPINames, recordId1, recordId2);
        }

        return new List<Map<Id, Map<String, Object>>>();
    }

    @AuraEnabled
    public static Boolean validateObjectAPINames(String recordId1, String recordId2) {
        String record1APIName = getObjectApiNameFromId(recordId1);
        String record2APIName = getObjectApiNameFromId(recordId2);

        if(record1APIName != record2APIName) {
            return false;
        }

        return true;
    }

    private static String getObjectApiNameFromId(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }

    private static Map<String,Schema.SObjectField> getSObjectFieldNames(Id recordId) {
        return recordId.getSObjectType().getDescribe().fields.getMap();
    } 

    private static List<String> getSObjectFieldsAPINames(Map<String,Schema.SObjectField> fieldsSchemaMap) {
        List<String> apiNames = new List<String>();
        for(String apiName : fieldsSchemaMap.keySet()) {
            apiNames.add(fieldsSchemaMap.get(apiName).getDescribe().getName());
        }
        return apiNames;
    } 

    private static Map<Id, Map<String, Object>> combineFields(List<SObject> sobjectRecords, List<String> sobjectFieldsAPINames) {
        Map<Id, Map<String, Object>> recordFieldsValuesByAPINameByRecordId = new Map<Id, Map<String, Object>>();

        for(SObject record : sobjectRecords) {
            if(!recordFieldsValuesByAPINameByRecordId.containsKey(record.Id)) {
                Map<String, Object> fieldValueByFieldAPIName = new Map<String, Object>();
                recordFieldsValuesByAPINameByRecordId.put(record.Id, fieldValueByFieldAPIName);
            } 

            Map<String, Object> fieldsToValue = record.getPopulatedFieldsAsMap();

            for(String fieldAPIName : sobjectFieldsAPINames) {
                if(fieldsToValue.containsKey(fieldAPIName) && !recordFieldsValuesByAPINameByRecordId.get(record.Id).containsKey(fieldAPIName)) {
                    recordFieldsValuesByAPINameByRecordId.get(record.Id).put(fieldAPIName, (Object)fieldsToValue.get(fieldAPIName));
                }
            }
        }

        return recordFieldsValuesByAPINameByRecordId;
    }

    private static List<Map<Id, Map<String, Object>>> compareRecordFieldValuesAndFindDifferent(Map<Id, Map<String, Object>> recordFieldsAndValues, List<String> sobjectFieldsAPINames, String recordId1, String recordId2) {
        Map<Id, Map<String, Object>> leftRecordWithDifferentValues = new Map<Id, Map<String, Object>>{recordId1 => new Map<String, Object>()};
        Map<Id, Map<String, Object>> rightRecordWithDifferentValues = new Map<Id, Map<String, Object>>{recordId2 => new Map<String, Object>()};
        
        for(String fieldApiName : sobjectFieldsAPINames) {
            if(recordFieldsAndValues.get(recordId1).get(fieldApiName) != recordFieldsAndValues.get(recordId2).get(fieldApiName)) {
                leftRecordWithDifferentValues.get(recordId1).put(fieldApiName, recordFieldsAndValues.get(recordId1).get(fieldApiName));
                rightRecordWithDifferentValues.get(recordId2).put(fieldApiName, recordFieldsAndValues.get(recordId2).get(fieldApiName));
            }
        }

        return new List<Map<Id, Map<String, Object>>>{leftRecordWithDifferentValues, rightRecordWithDifferentValues};
    }
}