package com.app.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.app.model.UserProfile;

public interface UserProfileRepository  extends CrudRepository<UserProfile, Long>{
List<UserProfile>findAll();
boolean existsByName(String name);
}
