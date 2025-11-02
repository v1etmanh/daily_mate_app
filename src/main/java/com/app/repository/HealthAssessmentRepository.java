package com.app.repository;

import org.springframework.data.repository.CrudRepository;

import com.app.model.HealthAssessmentResponse;

public interface HealthAssessmentRepository  extends CrudRepository<HealthAssessmentResponse, Long>{

}
