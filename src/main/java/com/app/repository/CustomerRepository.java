package com.app.repository;

import org.springframework.data.repository.CrudRepository;

import com.app.model.Customer;

public interface CustomerRepository extends CrudRepository<Customer, Long> {
 Customer  findCustomerByEmail(String email);
 Customer findByCustomerId(long id);
}
