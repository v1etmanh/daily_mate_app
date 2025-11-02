package com.app.repository;

import org.springframework.data.repository.CrudRepository;


import com.app.model.DishCreate;

public interface DishRepository extends CrudRepository<DishCreate, Long> {

}
