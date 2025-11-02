package com.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.app.model.Todo;

public interface TodoRepository extends CrudRepository<Todo,Long>{
	List<Todo>findAll();
	@Query("SELECT t FROM Todo t WHERE t.userProfile.userId IN :userIds")
	List<Todo> findAllByUserIds(List<Long> userIds);
	 @Modifying
	    @Query("DELETE FROM Todo t WHERE t.todoId = :todoId")
	    void deleteByTodoId(@Param("todoId") long todoId);

}
