package com.app.model;

import java.util.List;

public record DishEvaluateWrapper (
	  List<DishEvaluateRequest> dishes,
	     List<UserProfileDto> users,
	     java.sql.Date createDate
) {}
