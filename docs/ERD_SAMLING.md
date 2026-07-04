**DAFTAR TABEL DALAM DATABASE SAMLING**

1. users (sementara masih admin aja)  
* id  
* name  
* password  
* role (enum admin aja, default admin)


2. zones (wilayah tps)  
* id  
* name  
* latitude  
* longitude  
* risk\_status (Normal, Warning, High Priority)  
* created\_at


3. sensor\_data  
* id  
* zone\_id  
* sensor\_type  
* fill\_percentage  
* value  
* created\_at  
    
4. volume\_predictions  
* id  
* zone\_id  
* predicted\_volume  
* target\_time  
* confidence\_score   
* created\_at  
    
5. citizen\_reports  
* id  
* whatsapp\_number  
* report content  
* zone\_id  
* created\_at  
    
6. route\_recommendations  
* id  
* route\_json (store zone\_ids → ex: \[1, 3, 5, 4, 2)\])  
* created\_at  
* updated\_at

7. drivers  
* name  
* whatsapp\_number  
* zone\_id