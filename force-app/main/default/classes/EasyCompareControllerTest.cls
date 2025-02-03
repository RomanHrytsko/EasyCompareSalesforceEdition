@IsTest
public with sharing class EasyCompareControllerTest {
    @TestSetup
    static void setup(){
        Account acc1 = DataFactory.createAccount('Test1', false);
        Account acc2 = DataFactory.createAccount('Test2', false);

        insert new List<Account> {acc1, acc2};
    }


    @IsTest
    private static void testComparison() {
        List<Account> accountsToCompare = [
                SELECT Id
                FROM Account
        ];

        List<Map<Id, Map<String, Object>>> comparisonResult = new List<Map<Id, Map<String, Object>>>();
        System.assert(accountsToCompare.size() == 2);

        Test.startTest();
            comparisonResult =  EasyCompareController.compareRecords(accountsToCompare[0].Id, accountsToCompare[1].Id);
        Test.stopTest();

        System.assertNotEquals(
                String.valueOf(comparisonResult[0].get(accountsToCompare[0].Id).get('Name')),
                String.valueOf(comparisonResult[1].get(accountsToCompare[1].Id).get('Name'))
        );
    }
}