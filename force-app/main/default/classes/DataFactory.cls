@IsTest
public with sharing class DataFactory {

    public static Account createAccount(String accountName, Boolean doInsert) {
        Account acc = new Account();

        acc.Name = accountName;
        
        if(doInsert) {
            insert acc;
        }

        return acc;
    }

    public static List<Account> getAllAccounts() {
        return [SELECT Id FROM Account];
    }
}