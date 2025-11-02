package com.app.repository;

import org.springframework.data.repository.CrudRepository;

import com.app.model.DishRecommendation;

public interface DishRecommendationRepository  extends CrudRepository<DishRecommendation, Long>{
	

}
