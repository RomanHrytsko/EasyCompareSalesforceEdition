public with sharing class EasyCompareController {
    public EasyCompareController() {}
    
    @AuraEnabled
    public static void compareRecords(String recordId1, String recordId2) {
        String record1ApiName = getObjectApiNameFromId(recordId1);
        String record2ApiName = getObjectApiNameFromId(recordId2);

        if(record1ApiName == record2ApiName) {
            
        }
    }

    private static String getObjectApiNameFromId(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }
}