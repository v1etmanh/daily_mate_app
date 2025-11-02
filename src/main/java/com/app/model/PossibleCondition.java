package com.app.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@AllArgsConstructor
@RequiredArgsConstructor
@Data

public class PossibleCondition {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(name = "poss_id")
private long possID;
private String name;            // Tên bệnh
private String likelihood;      // Mức độ khả năng ("Cao", "Trung bình", "Thấp")
private String description; 
// Mô tả bệnh
@ManyToOne
@JoinColumn(name = "health_id")
@JsonBackReference
private HealthAssessmentResponse healths;

}
