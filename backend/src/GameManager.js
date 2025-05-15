import { Socket } from "socket.io";

export class GameManager { 

    constructor (){ 
      Game = [{ 
        
      }]; 

      Users = []; 


      this.Game = [];

    }
     addUser = (socket)=>{ 
     this.Users.push(socket);
     
     }
   removeUser = (socket) => { 
         this.Users.filter((socket) => socket.id !== socket.id); 

    }

}