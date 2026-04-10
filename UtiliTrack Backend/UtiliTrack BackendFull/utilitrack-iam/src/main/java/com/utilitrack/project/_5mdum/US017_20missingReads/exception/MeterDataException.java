package com.utilitrack.project._5mdum.US017_20missingReads.exception;

                                                    public class MeterDataException extends RuntimeException {

                                                        private final int statusCode;

                                                        public MeterDataException(String message) {
                                                            super(message);
                                                            this.statusCode = 400;
                                                        }

                                                        public MeterDataException(String message, int statusCode) {
                                                            super(message);
                                                            this.statusCode = statusCode;
                                                        }

                                                        public int getStatusCode() {
                                                            return statusCode;
                                                        }
                                                 }