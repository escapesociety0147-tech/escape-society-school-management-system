from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, teacher, parent, student
    school_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    contact = Column(String)
    roll_number = Column(String)
    grade = Column(String)
    section = Column(String)
    school_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    attendance = relationship("Attendance", back_populates="student")
    results = relationship("Result", back_populates="student")
    payments = relationship("Payment", back_populates="student")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    department = Column(String)
    subjects = Column(String)  # comma-separated
    school_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    relationship = Column(String, default="Parent")
    school_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    date = Column(String, nullable=False)  # ISO format YYYY-MM-DD
    status = Column(String, nullable=False)  # present, absent, late
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="attendance")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String, nullable=False)
    score = Column(Float)
    grade = Column(String)
    term = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="results")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    amount_due = Column(Float)
    amount_paid = Column(Float, default=0)
    status = Column(String, default="pending")  # paid, pending, overdue
    fee_type = Column(String)
    last_payment = Column(String)  # ISO date
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="payments")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(String)
    time = Column(String)
    location = Column(String)
    category = Column(String)
    school_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())