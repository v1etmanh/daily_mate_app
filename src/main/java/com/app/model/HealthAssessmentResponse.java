package com.app.model;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@AllArgsConstructor
@RequiredArgsConstructor
@Data
public class HealthAssessmentResponse {
@Id
@GeneratedValue(strategy =GenerationType.IDENTITY)
@Column(name = "health_id")
private long healthId;
private String bodyPart;                        // Vị trí bị đau
private String symptomDescription;              // Mô tả triệu chứng
@OneToMany(mappedBy = "healths",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
@JsonManagedReference
private List<PossibleCondition> possibleConditions; // Danh sách bệnh có thể gặp
@ElementCollection
@CollectionTable(name = "suggested_actions", joinColumns = @JoinColumn(name = "health_id"))
@Column(name = "action")

private List<String> suggestedActions;          // Các hành động được khuyến nghị
private String emergencyLevel;                  // Mức độ khẩn cấp (Cao/Trung bình/Thấp)
private boolean recommendSeeDoctor;  
@ManyToOne
@JoinColumn(name = "user_id")
@JsonBackReference
private UserProfile user;
}
