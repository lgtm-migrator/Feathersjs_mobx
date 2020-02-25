import React, { useContext, useEffect,useState } from "react";
import { GobalStoreContext } from "../../store";
import {  observer } from "mobx-react";
import * as _ from "lodash/fp";
import {  useHistory } from "react-router-dom";
import {Card} from 'antd'
import {
    Form,
    FormContent,
    Box,
    Flex,
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
    Button,
    Text
} from "grey-vest";
import { RestaurantContext } from "./local-store";
import {
    _Command,
    extraCommand,
    beforeAndAfter,
} from "../../utils/extend-futil";
import { extendObservable } from "mobx";
import { CommandButton ,FormField} from "../../components";
import {RestaurantForm} from "./components/raw-form";

import "antd/dist/antd.css";
import RestaurantsTable from "./restaurants-table";

const BeforeAndAfterCommand = extraCommand(_Command, beforeAndAfter, x => y =>
    extendObservable(y, x)
);
const Restauarants = ({}) => {
    const globalStore = useContext(GobalStoreContext);
    const localStore = useContext(RestaurantContext);
    const [restaurantData, setRestaurantData] = useState(localStore.restaurants);
    const { token } = globalStore;
    const fetchRestaurantsCommand = {
        main: BeforeAndAfterCommand(async () => {
            try {
                const res = await localStore.fetchRestaurantsEffect(token);
                return { arg: res.data };
            } catch (e) {
                throw e;
            }
        }),
        arg: {
            afterFn: async arg => {
                setRestaurantData(arg);
            }
        }
    };

    useEffect(() => {
        const { main, arg } = fetchRestaurantsCommand;
        main(arg);
    }, []);

    const {
        restaurant,
        restaurants,
        isUpdateModalVisible,
        loading,
        setRestaurant,
        setrestaurants,
        setUpdateModalVisible,
        editRestaurantEffect,
        createRestaurantEffect
    } = localStore;

    const showModalCommand = {
        main: BeforeAndAfterCommand(async () => {
            setRestaurant({});
        }),
        arg: {
            beforeFn: () => {},
            afterFn: () => {
                setUpdateModalVisible(true);
            }
        }
    };

    const submitRecordCommand = {
        main: BeforeAndAfterCommand(async () => {
            const form = await RestaurantForm.submit();
            if (form) {
                const fields = form.getSnapshot();
                const { type } = fields;
                fields.type = _.isObjectLike(type) ? type[0] : type;
                const _id = restaurant._id;
                console.log(_id);
                return _.isEmpty(_id)
                    ? await createRestaurantEffect(fields, token)
                    : await editRestaurantEffect({ _id, ...fields }, token);
            } else {
                throw { name: "form valid error", message: "please fix your mistake" };
            }
        }),

        arg: {
            afterFn: () => {
                const { main, arg } = fetchRestaurantsCommand;
                main(arg);
                setRestaurant({});
                _.each(i => (i.value = null))(RestaurantForm.fields);
            }
        }
    };


    const showEditModalCommand= {
        main: BeforeAndAfterCommand(async () => {
            setUpdateModalVisible(true);
        }),
        arg: {
            beforeFn:(item)=>{
                setRestaurant(item);
                RestaurantForm.fields.name.value = item.name;
                RestaurantForm.fields.address.value = item.address;
                RestaurantForm.fields.star.value = item.star;
                RestaurantForm.fields.type.value = [item.type];
            },
            beforeArg:{},
            afterFn: () => {
                setUpdateModalVisible(true);
            }
        }
    }
    const showEditModal = async item => {
        const {main,arg} = showEditModalCommand
        const newArg = _.assign(arg,{beforeArg:item})
        main(newArg)
    };


    const deleteRecordCommand={
        main: BeforeAndAfterCommand(async ({id}) => {
            try {
                const res = await localStore.deleteRestaurantEffect(id, token);
                return { arg: res };
            } catch (e) {
                throw e;
            }
        }),
        arg: {
            afterFn: async args => {
                console.log(args)
                const { main, arg } = fetchRestaurantsCommand;
                main(arg);
            }
        }
    }

    const deleteRecord = async id => {
        const {main,arg} = deleteRecordCommand
        const newArg = _.assign(arg,{id:id})
        main(newArg)
    };


    return (
        <div style={{ backgroundColor: "red !important" }}>


            <Card style={{ marginRight: "50px" }}     loading={loading}>
                <CommandButton
                    command={showModalCommand.main}
                    arg={showModalCommand.arg}
                    style={{ width: "100%", margin: "20px auto" }}
                >
                    Creat Restaurant
                </CommandButton>
                <RestaurantsTable
                    restaurantData={restaurantData}
                    deleteRecord={deleteRecord}
                    showEditModal={showEditModal}
                />
            </Card>

            <Modal
                isOpen={isUpdateModalVisible}
                onClose={() => {
                    setUpdateModalVisible(false);
                }}
            >
                <ModalHeader>{_.isEmpty(restaurant) ? "Create" : "Edit"}</ModalHeader>
                <ModalContent>
                    <Form as={Box} className='form-main'>
                        <Flex justifyContent='center'>
                            <h1 className='form-header'>Restaurant Info</h1>
                        </Flex>
                        <FormContent columns={2}>
                            <FormField field={RestaurantForm.fields.name} width={2} />
                            <FormField field={RestaurantForm.fields.address} width={2} />
                            <FormField field={RestaurantForm.fields.star} width={2} />
                            <FormField field={RestaurantForm.fields.type} width={2} />
                        </FormContent>
                    </Form>
                </ModalContent>
                <ModalFooter>
                    <Button
                        onClick={() => {
                            setUpdateModalVisible(false);
                        }}
                    >
                        cancel
                    </Button>
                    <CommandButton
                        command={submitRecordCommand.main}
                        arg={submitRecordCommand.arg}
                    >
                        Submit
                    </CommandButton>
                </ModalFooter>
            </Modal>


        </div>
    );
};

export default observer(Restauarants);

