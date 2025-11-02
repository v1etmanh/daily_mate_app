package com.app.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RestController;

import com.app.model.Location;
import com.app.model.Todo;
import com.app.model.TodoCreateRequest;
import com.app.service.TodoService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/todo")
@CrossOrigin(origins = "http://localhost:3000")
public class TodoListController {
@Autowired
private TodoService todoSer;
@GetMapping("/users")
public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal Jwt jwt) {
	String email=jwt.getClaimAsString("email");
    return ResponseEntity
            .status(HttpStatus.OK)
            .body(todoSer.retrievedALlUser(email));
}
@PostMapping("/createTodo")
public ResponseEntity<?> postMethodName(@RequestBody TodoCreateRequest entity) {
    //TODO: process POST request
	
    Todo todo=this.todoSer.createNewTodo(entity);
    return ResponseEntity.status(HttpStatus.OK).body(todo);
    
}
@DeleteMapping("/removeTodo")
public ResponseEntity<?> deleteTodoById(@RequestParam("id") long id,@AuthenticationPrincipal Jwt jwt){
	String email=jwt.getClaimAsString("email");
	boolean x= this.todoSer.removeTodoById(id,email);
	if(x==false)return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).build();
	return ResponseEntity.status(HttpStatus.OK).build();
}
@GetMapping("/getTodos")
public ResponseEntity<?> getAlltodos(@AuthenticationPrincipal Jwt jwt ) {
	String email=jwt.getClaimAsString("email");
    return ResponseEntity.status(HttpStatus.OK).body( this.todoSer.retrieveAllTodo(email));
}
@GetMapping("/generateTodo")
public ResponseEntity<?> generateTodo(@RequestParam("id")long id,@RequestParam("location")String location,@AuthenticationPrincipal Jwt jwt) throws IOException, InterruptedException{
	System.out.print(id);
	String emai=jwt.getClaimAsString("email");
	Todo td=this.todoSer.createTodoByAi(emai, location, id);
	
	return ResponseEntity.status(HttpStatus.OK).build();
}

}
