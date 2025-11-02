package com.app.model;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;


@Data
@AllArgsConstructor
@RequiredArgsConstructor

@Entity
public class DishCreate {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
private long dishCreateId;
	@OneToMany(mappedBy = "dishCreate", cascade = CascadeType.ALL, orphanRemoval = true)
	@JsonManagedReference
	private List<DishAdviceResponse> listDish;
private Date  createTime;
@ManyToOne
@JoinColumn(name = "customer_id")
@JsonBackReference
private  Customer cusId;
}
