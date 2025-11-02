package com.app.model;

import java.sql.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@Entity
@AllArgsConstructor
@RequiredArgsConstructor
@Data
public class Customer {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name="customer_id")
	private long customerId;
	private Date createDate;
	private String username;
	@Column(unique = true)
	private String email;
	private String givenName;
	private String familyName;
	private String role;
	@OneToMany(mappedBy = "cusId", cascade = CascadeType.ALL, orphanRemoval = true)
	 @JsonManagedReference
	private List<DishCreate> dishCreateId;
	@OneToMany(mappedBy = "cusId", cascade = CascadeType.ALL, orphanRemoval = true)
	 @JsonManagedReference
	private List<UserProfile>userProfiles;
}